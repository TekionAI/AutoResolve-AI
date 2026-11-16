
const mongoose = require("mongoose");

const Recommendation = require("../models/Recommendation");
const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const VendorInventory = require("../models/VendorInventory");
const Notification = require("../models/Notification");
const User = require("../models/User");

const applyRecommendation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const recommendation = await Recommendation.findById(
        req.params.recommendationId
      ).session(session);

      if (!recommendation) {
        throw new Error("Recommendation not found");
      }

      if (recommendation.status !== "Approved") {
        throw new Error(
          "Only approved recommendations can be applied"
        );
      }

      const repairOrder = await RepairOrder.findById(
        recommendation.repairOrder
      ).session(session);

      if (!repairOrder) {
        throw new Error("Repair order not found");
      }

      const partId = recommendation.shortageDetails.part;
      const dealershipId = repairOrder.dealership;
      const quantity = Number(
        recommendation.proposedSource.quantity
      );

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid sourcing quantity");
      }

      const source = recommendation.proposedSource;

      // Step 1: Deduct stock from the selected source.
      if (source.sourceType === "Sister Dealership") {
        if (!source.dealership) {
          throw new Error("Sister dealership not specified");
        }

        if (
          source.dealership.toString() === dealershipId.toString()
        ) {
          throw new Error(
            "Source and destination dealerships cannot be the same"
          );
        }

        const sisterStock = await Inventory.findOne({
          dealership: source.dealership,
          part: partId,
        }).session(session);

        if (!sisterStock) {
          throw new Error("Sister dealership inventory not found");
        }

        const availableQuantity =
          sisterStock.quantity - sisterStock.reservedQuantity;

        if (availableQuantity < quantity) {
          throw new Error("Insufficient sister dealership stock");
        }

        sisterStock.quantity -= quantity;
        sisterStock.lastStockUpdate = new Date();

        await sisterStock.save({ session });
      } else if (source.sourceType === "Vendor") {
        if (!source.vendor) {
          throw new Error("Vendor not specified");
        }

        const vendorStock = await VendorInventory.findOne({
          vendor: source.vendor,
          part: partId,
          isAvailable: true,
        }).session(session);

        if (
          !vendorStock ||
          vendorStock.availableQuantity < quantity
        ) {
          throw new Error("Insufficient vendor stock");
        }

        vendorStock.availableQuantity -= quantity;
        vendorStock.lastUpdated = new Date();

        if (vendorStock.availableQuantity === 0) {
          vendorStock.isAvailable = false;
        }

        await vendorStock.save({ session });
      } else {
        throw new Error("Unsupported sourcing type");
      }

      // Step 2: Add the received stock to the destination dealership.
      let destinationStock = await Inventory.findOne({
        dealership: dealershipId,
        part: partId,
      }).session(session);

      if (!destinationStock) {
        destinationStock = new Inventory({
          dealership: dealershipId,
          part: partId,
          quantity: 0,
          reservedQuantity: 0,
          reservations: [],
          reorderLevel: 5,
        });
      }

      destinationStock.quantity += quantity;
      destinationStock.lastStockUpdate = new Date();

      // Step 3: Calculate how much this repair order still needs.
      const requiredQuantity = repairOrder.requiredParts
        .filter(
          (item) => item.part.toString() === partId.toString()
        )
        .reduce(
          (total, item) => total + item.requiredQuantity,
          0
        );

      if (requiredQuantity <= 0) {
        throw new Error(
          "Sourced part is not listed in this repair order"
        );
      }

      const existingReservation = destinationStock.reservations
        .filter(
          (item) =>
            item.repairOrder.toString() ===
            repairOrder._id.toString()
        )
        .reduce(
          (total, item) => total + item.quantity,
          0
        );

      const remainingRequired =
        Math.max(0, requiredQuantity - existingReservation);

      // Reserve only the quantity this repair order still needs.
      const quantityToReserve = Math.min(
        quantity,
        remainingRequired
      );

      if (quantityToReserve > 0) {
        const reservation = destinationStock.reservations.find(
          (item) =>
            item.repairOrder.toString() ===
            repairOrder._id.toString()
        );

        if (reservation) {
          reservation.quantity += quantityToReserve;
        } else {
          destinationStock.reservations.push({
            repairOrder: repairOrder._id,
            quantity: quantityToReserve,
          });
        }

        destinationStock.reservedQuantity += quantityToReserve;
      }

      await destinationStock.save({ session });

      // Step 4: Check every required part for this repair order.
      let allPartsReserved = true;

      for (const requiredPart of repairOrder.requiredParts) {
        const requiredPartQuantity = repairOrder.requiredParts
          .filter(
            (item) =>
              item.part.toString() ===
              requiredPart.part.toString()
          )
          .reduce(
            (total, item) => total + item.requiredQuantity,
            0
          );

        const partInventory = await Inventory.findOne({
          dealership: dealershipId,
          part: requiredPart.part,
        }).session(session);

        const reservedForThisOrder = partInventory
          ? partInventory.reservations
              .filter(
                (item) =>
                  item.repairOrder.toString() ===
                  repairOrder._id.toString()
              )
              .reduce(
                (total, item) => total + item.quantity,
                0
              )
          : 0;

        if (reservedForThisOrder < requiredPartQuantity) {
          allPartsReserved = false;
          break;
        }
      }

      // Step 5: Unblock only when every required part is reserved.
      const wasBlocked = repairOrder.isBlocked;

      if (allPartsReserved) {
        repairOrder.status = "Ready for Service";
        repairOrder.isBlocked = false;
        repairOrder.blockedReason = null;
      } else {
        repairOrder.status = "Waiting for Parts";
        repairOrder.isBlocked = true;
        repairOrder.blockedReason =
          "One or more required parts are still unavailable";
      }

      await repairOrder.save({ session });

      // Step 6: Notify Managers and Service Advisors when unblocked.
      if (wasBlocked && allPartsReserved) {
        const recipients = await User.find({
          dealership: dealershipId,
          role: { $in: ["Manager", "Service Advisor"] },
          isActive: true,
        })
          .select("_id")
          .session(session);

        const notifications = recipients.map((recipient) => ({
          recipient: recipient._id,
          dealership: dealershipId,
          type: "REPAIR_ORDER_UNBLOCKED",
          title: "Repair Order Unblocked",
          message: `Repair order ${repairOrder.roNumber} now has all required parts reserved and is ready for service.`,
          relatedEntity: {
            entityType: "RepairOrder",
            entityId: repairOrder._id,
          },
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications, { session });
        }
      }

      // Step 7: Mark recommendation as applied.
      recommendation.status = "Applied";
      await recommendation.save({ session });

      result = {
        recommendationId: recommendation._id,
        repairOrderNumber: repairOrder.roNumber,
        transferredQuantity: quantity,
        reservedQuantity: quantityToReserve,
        partId,
        allPartsReserved,
        repairOrderStatus: repairOrder.status,
        recommendationStatus: recommendation.status,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Recommendation applied and inventory updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

module.exports = { applyRecommendation };
