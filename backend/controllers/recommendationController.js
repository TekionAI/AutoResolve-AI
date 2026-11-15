const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const Recommendation = require("../models/Recommendation");
const { findSourceOptions } = require("../services/sourcingService");

const generateSourcingRecommendations = async (req, res) => {
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

    const generatedRecommendations = [];

    for (const item of repairOrder.requiredParts) {
      const part = item.part;
      const requiredQuantity = item.requiredQuantity;

      const localStock = await Inventory.findOne({
        dealership: repairOrder.dealership,
        part: part._id,
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
        continue;
      }

      const sourcingResult = await findSourceOptions(
        repairOrder.dealership,
        part._id,
        shortageQuantity
      );

      const eligibleSources = sourcingResult.options
        .filter((source) => source.canFulfilEntireQuantity)
        .sort((a, b) => b.score - a.score);

      const bestSource = eligibleSources[0] || null;

      let proposedSource = {
        sourceType: null,
        dealership: null,
        vendor: null,
        quantity: 0,
        estimatedDeliveryHours: null,
        estimatedCost: null,
      };

      let explanation = "";

      let estimatedCostSaved = 0;

      if (bestSource) {
        proposedSource = {
          sourceType: bestSource.sourceType,
          dealership:
            bestSource.sourceType === "Sister Dealership"
              ? bestSource.sourceId
              : null,
          vendor:
            bestSource.sourceType === "Vendor"
              ? bestSource.sourceId
              : null,
          quantity: shortageQuantity,
          estimatedDeliveryHours:
            bestSource.estimatedDeliveryHours,
          estimatedCost:
            bestSource.unitPrice * shortageQuantity,
        };

        estimatedCostSaved = Math.max(
          0,
          (part.unitPrice - bestSource.unitPrice) *
            shortageQuantity
        );

        explanation =
          `${bestSource.sourceName} is the highest-ranked eligible source. ` +
          `It can supply all ${shortageQuantity} required units ` +
          `within an estimated ${bestSource.estimatedDeliveryHours} hours. ` +
          `Its ranking score is ${bestSource.score}.`;
      } else {
        explanation =
          `A shortage of ${shortageQuantity} units exists, ` +
          `but no single available source can fulfil the complete quantity. ` +
          `Manual review or a combined sourcing plan is required.`;
      }

      const recommendationData = {
        recommendationType: "Parts Sourcing",

        shortageDetails: {
          part: part._id,
          requiredQuantity,
          availableQuantity: localAvailableQuantity,
        },

        proposedSource,

        explanation,
        estimatedCostSaved,

        status: "Pending",
      };

      const recommendation = await Recommendation.findOneAndUpdate(
        {
          repairOrder: repairOrder._id,
          recommendationType: "Parts Sourcing",
          "shortageDetails.part": part._id,
          status: "Pending",
        },
        {
          $set: recommendationData,
          $setOnInsert: {
            repairOrder: repairOrder._id,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      generatedRecommendations.push(recommendation);
    }

    return res.status(200).json({
      success: true,
      message: "Sourcing recommendations generated successfully",
      repairOrder: {
        id: repairOrder._id,
        roNumber: repairOrder.roNumber,
      },
      count: generatedRecommendations.length,
      recommendations: generatedRecommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find()
      .populate("repairOrder")
      .populate("shortageDetails.part")
      .populate("proposedSource.dealership")
      .populate("proposedSource.vendor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateSourcingRecommendations,
  getAllRecommendations,
};