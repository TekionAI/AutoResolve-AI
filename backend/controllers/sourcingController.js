const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const { findSourceOptions } = require("../services/sourcingService");

const getSourcingOptions = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findById(
      req.params.repairOrderId
    ).populate("requiredParts.part");

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