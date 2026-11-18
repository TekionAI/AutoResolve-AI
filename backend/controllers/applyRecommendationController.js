
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
        throw new Error("Only approved recommendations can be applied");
      }

      const repairOrder = await RepairOrder.findOne({
        _id: recommendation.repairOrder,
        dealership: req.user.dealership,
      }).session(session);

      if (!repairOrder) {
        throw new Error("Repair order not found or access denied");
      }

      const partId = recommendation.shortageDetails.part;
      const dealershipId = repairOrder.dealership;

      if (!partId) {
        throw new Error("Part not specified in recommendation");
      }

      // Support both new combined recommendations and older records.
      const proposedSources =
        recommendation.proposedSources?.length > 0
          ? recommendation.proposedSources
          : [recommendation.proposedSource];

      if (!proposedSources.length || !proposedSources[0]) {
        throw new Error("No sourcing allocation found");
      }

      // Validate allocations before changing any inventory.
      const validatedSources = proposedSources.map((source) => {
        const quantity = Number(source.quantity);

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("Invalid sourcing quantity");
        }

        if (
          source.sourceType !== "Sister Dealership" &&
          source.sourceType !== "Vendor"
        ) {
          throw new Error("Unsupported sourcing type");
        }

        if (
          source.sourceType === "Sister Dealership" &&
          !source.dealership
        ) {
          throw new Error("Sister dealership not specified");
        }

        if (source.sourceType === "Vendor" && !source.vendor) {
          throw new Error("Vendor not specified");
        }

        return { source, quantity };
      });

      // Prevent duplicate allocations against the same stock record.
      const sourceKeys = validatedSources.map(({ source }) => {
        const sourceId =
          source.sourceType === "Sister Dealership"
            ? source.dealership
            : source.vendor;

        return `${source.sourceType}:${sourceId.toString()}`;
      });

      if (new Set(sourceKeys).size !== sourceKeys.length) {
        throw new Error("Duplicate sourcing allocation detected");
      }

      const totalPlannedQuantity = validatedSources.reduce(
        (total, item) => total + item.quantity,
        0
      );

      const shortageQuantity = Number(
        recommendation.shortageDetails.requiredQuantity
      );

      if (
        !Number.isInteger(shortageQuantity) ||
        shortageQuantity <= 0
      ) {
        throw new Error("Invalid required shortage quantity");
      }

      if (totalPlannedQuantity > shortageQuantity) {
        throw new Error("Sourcing allocation exceeds the required shortage");
      }

      // Step 1: Deduct stock from every allocated source.
      const sourceBreakdown = [];
      let transferredQuantity = 0;

      for (const { source, quantity } of validatedSources) {
        if (source.sourceType === "Sister Dealership") {
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
            throw new Error(
              `Insufficient stock at ${source.sourceName || "sister dealership"}`
            );
          }

          sisterStock.quantity -= quantity;
          sisterStock.lastStockUpdate = new Date();

          await sisterStock.save({ session });
        } else {
          const vendorStock = await VendorInventory.findOne({
            vendor: source.vendor,
            part: partId,
            isAvailable: true,
          }).session(session);

          if (
            !vendorStock ||
            vendorStock.availableQuantity < quantity
          ) {
            throw new Error(
              `Insufficient stock at ${source.sourceName || "vendor"}`
            );
          }

          vendorStock.availableQuantity -= quantity;
          vendorStock.lastUpdated = new Date();

          if (vendorStock.availableQuantity === 0) {
            vendorStock.isAvailable = false;
          }

          await vendorStock.save({ session });
        }

        transferredQuantity += quantity;

        sourceBreakdown.push({
          sourceType: source.sourceType,
          sourceName: source.sourceName || "",
          quantity,
        });
      }

      // Step 2: Add the combined transferred stock to the destination.
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

      destinationStock.quantity += transferredQuantity;
      destinationStock.lastStockUpdate = new Date();

      // Step 3: Calculate the quantity this repair order still requires.
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
            item.repairOrder.toString() === repairOrder._id.toString()
        )
        .reduce(
          (total, item) => total + item.quantity,
          0
        );

      const remainingRequired = Math.max(
        0,
        requiredQuantity - existingReservation
      );


      // Include both existing unreserved stock and newly transferred stock.
const availableToReserve = Math.max(
  0,
  destinationStock.quantity - destinationStock.reservedQuantity
);

const quantityToReserve = Math.min(
  remainingRequired,
  availableToReserve
);
      if (quantityToReserve > 0) {
        const reservation = destinationStock.reservations.find(
          (item) =>
            item.repairOrder.toString() === repairOrder._id.toString()
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

      // Step 4: Check whether every required part is fully reserved.
      let allPartsReserved = true;

      for (const requiredPart of repairOrder.requiredParts) {
        const requiredPartQuantity = repairOrder.requiredParts
          .filter(
            (item) =>
              item.part.toString() === requiredPart.part.toString()
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

      // Step 5: Unblock only when all required parts are reserved.
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

      // Step 7: Mark the recommendation as applied.
      recommendation.status = "Applied";
      await recommendation.save({ session });

      result = {
        recommendationId: recommendation._id,
        repairOrderNumber: repairOrder.roNumber,
        partId,
        sourceBreakdown,
        transferredQuantity,
        reservedQuantity: quantityToReserve,
        remainingShortage: Math.max(
          0,
          requiredQuantity - existingReservation - quantityToReserve
        ),
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
