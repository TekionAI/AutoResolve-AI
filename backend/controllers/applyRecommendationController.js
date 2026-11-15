const mongoose = require("mongoose");

const Recommendation = require("../models/Recommendation");
const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const VendorInventory = require("../models/VendorInventory");

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
      const quantity = recommendation.proposedSource.quantity;

      if (!quantity || quantity <= 0) {
        throw new Error("Invalid sourcing quantity");
      }

      const source = recommendation.proposedSource;

      if (source.sourceType === "Sister Dealership") {
        if (!source.dealership) {
          throw new Error("Sister dealership not specified");
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

        if (!vendorStock || vendorStock.availableQuantity < quantity) {
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

      await Inventory.findOneAndUpdate(
        {
          dealership: dealershipId,
          part: partId,
        },
        {
          $inc: { quantity },
          $set: { lastStockUpdate: new Date() },
          $setOnInsert: {
            dealership: dealershipId,
            part: partId,
            reservedQuantity: 0,
            reorderLevel: 5,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          session,
        }
      );

      repairOrder.status = "Ready for Service";
      repairOrder.isBlocked = false;
      repairOrder.blockedReason = null;

      await repairOrder.save({ session });

      recommendation.status = "Applied";

      await recommendation.save({ session });

      result = {
        recommendationId: recommendation._id,
        repairOrderNumber: repairOrder.roNumber,
        transferredQuantity: quantity,
        partId,
        status: recommendation.status,
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