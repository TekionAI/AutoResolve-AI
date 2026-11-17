
const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { findSourceOptions } = require("../services/sourcingService");

const getSourcingOptions = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findOne({
  _id: req.params.repairOrderId,
  dealership: req.user.dealership,
}).populate("requiredParts.part");

    if (!repairOrder) {
      return res.status(404).json({
        success: false,
        message: "Repair order not found",
      });
    }

    const results = [];

    for (const item of repairOrder.requiredParts) {
      const partId = item.part._id;
      const requiredQuantity = item.requiredQuantity;

      const localStock = await Inventory.findOne({
        dealership: repairOrder.dealership,
        part: partId,
      });

      const localAvailableQuantity = localStock
        ? Math.max(
            0,
            localStock.quantity - localStock.reservedQuantity
          )
        : 0;

      const shortageQuantity = Math.max(
        0,
        requiredQuantity - localAvailableQuantity
      );

      if (shortageQuantity === 0) {
        results.push({
          part: item.part,
          requiredQuantity,
          localAvailableQuantity,
          shortageQuantity: 0,
          message: "Sufficient local stock available",
          sourcing: [],
        });

        continue;
      }

      const sourcing = await findSourceOptions(
        repairOrder.dealership,
        partId,
        shortageQuantity
      );

      results.push({
        part: item.part,
        requiredQuantity,
        localAvailableQuantity,
        shortageQuantity,
        message: "Parts shortage detected",
        sourcing: sourcing.options,
      });
    }

    // Create notifications when a parts shortage is detected
    const shortages = results.filter(
      (item) => item.shortageQuantity > 0
    );

    if (shortages.length > 0) {
      try {
        const recipients = await User.find({
          dealership: repairOrder.dealership,
          role: { $in: ["Manager", "Service Advisor"] },
          isActive: true,
        }).select("_id");

        for (const recipient of recipients) {
          const existingNotification = await Notification.findOne({
            recipient: recipient._id,
            type: "PARTS_SHORTAGE",
            "relatedEntity.entityType": "RepairOrder",
            "relatedEntity.entityId": repairOrder._id,
          });

          if (!existingNotification) {
            await Notification.create({
              recipient: recipient._id,
              dealership: repairOrder.dealership,
              type: "PARTS_SHORTAGE",
              title: "Parts Shortage Detected",
              message: `A parts shortage has been detected for repair order ${repairOrder.roNumber}. ${shortages.length} required part(s) have insufficient local stock.`,
              relatedEntity: {
                entityType: "RepairOrder",
                entityId: repairOrder._id,
              },
            });
          }
        }
      } catch (notificationError) {
        console.error(
          "Parts shortage notification error:",
          notificationError.message
        );
      }
    }

    res.status(200).json({
      success: true,
      repairOrder: {
        id: repairOrder._id,
        roNumber: repairOrder.roNumber,
        status: repairOrder.status,
      },
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getSourcingOptions };
