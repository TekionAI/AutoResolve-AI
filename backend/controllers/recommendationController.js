
const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const Recommendation = require("../models/Recommendation");
const { findSourceOptions } = require("../services/sourcingService");

const generateSourcingRecommendations = async (req, res) => {
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

const alreadyReservedQuantity = localStock
  ? localStock.reservations
      .filter(
        (reservation) =>
          reservation.repairOrder.toString() ===
          repairOrder._id.toString()
      )
      .reduce(
        (total, reservation) => total + reservation.quantity,
        0
      )
  : 0;

const shortageQuantity = Math.max(
  0,
  requiredQuantity -
    alreadyReservedQuantity -
    localAvailableQuantity
);

      if (shortageQuantity === 0) {
        continue;
      }

      const sourcingResult = await findSourceOptions(
        repairOrder.dealership,
        part._id,
        shortageQuantity
      );

      const combinedPlan = sourcingResult.combinedPlan;

      const allocatedSources = combinedPlan.sources || [];

      const proposedSources = allocatedSources.map((source) => ({
        sourceType: source.sourceType,
        dealership:
          source.sourceType === "Sister Dealership"
            ? source.sourceId
            : null,
        vendor:
          source.sourceType === "Vendor"
            ? source.sourceId
            : null,
        sourceName: source.sourceName,
        location: source.location,
        quantity: source.allocatedQuantity,
        unitPrice: source.unitPrice,
        estimatedDeliveryHours: source.estimatedDeliveryHours,
        estimatedCost: source.estimatedCost,
        score: source.score,
      }));

      const bestSource = allocatedSources[0] || null;

      const proposedSource = bestSource
        ? {
            sourceType: bestSource.sourceType,
            dealership:
              bestSource.sourceType === "Sister Dealership"
                ? bestSource.sourceId
                : null,
            vendor:
              bestSource.sourceType === "Vendor"
                ? bestSource.sourceId
                : null,
            quantity: bestSource.allocatedQuantity,
            estimatedDeliveryHours:
              bestSource.estimatedDeliveryHours,
            estimatedCost: bestSource.estimatedCost,
          }
        : {
            sourceType: null,
            dealership: null,
            vendor: null,
            quantity: 0,
            estimatedDeliveryHours: null,
            estimatedCost: null,
          };

      const estimatedCostSaved = Math.max(
        0,
        part.unitPrice * combinedPlan.totalAllocatedQuantity -
          combinedPlan.totalCost
      );

      let explanation;

      if (allocatedSources.length === 0) {
        explanation =
          `A shortage of ${shortageQuantity} units exists, ` +
          `but no external stock is currently available.`;
      } else {
        const allocationDescription = proposedSources
          .map(
            (source) =>
              `${source.sourceName} (${source.quantity} units)`
          )
          .join(", ");

        if (combinedPlan.isFulfilled) {
          explanation =
            `The combined sourcing plan can fulfil all ${shortageQuantity} required units. ` +
            `The recommended allocation is ${allocationDescription}. ` +
            `The combined estimated cost is ₹${combinedPlan.totalCost.toLocaleString("en-IN")}, ` +
            `with an estimated delivery time of ${combinedPlan.estimatedDeliveryHours} hours.`;
        } else {
          explanation =
            `The combined sourcing plan can allocate ${combinedPlan.totalAllocatedQuantity} ` +
            `of ${shortageQuantity} required units from ${allocationDescription}. ` +
            `${combinedPlan.remainingQuantity} units will still remain unavailable. ` +
            `The combined estimated cost is ₹${combinedPlan.totalCost.toLocaleString("en-IN")}.`;
        }
      }

      const allocationMap = new Map(
        allocatedSources.map((source) => [
          `${source.sourceType}:${String(source.sourceId)}`,
          source.allocatedQuantity,
        ])
      );

      const recommendationData = {
        recommendationType: "Parts Sourcing",

        sourcingOptions: sourcingResult.options.map((source) => ({
          sourceType: source.sourceType,
          dealership:
            source.sourceType === "Sister Dealership"
              ? source.sourceId
              : null,
          vendor:
            source.sourceType === "Vendor"
              ? source.sourceId
              : null,
          sourceName: source.sourceName,
          location: source.location,
          availableQuantity: source.availableQuantity,
          quantity:
            allocationMap.get(
              `${source.sourceType}:${String(source.sourceId)}`
            ) || 0,
          unitPrice: source.unitPrice,
          estimatedDeliveryHours: source.estimatedDeliveryHours,
          reliabilityScore: source.reliabilityScore,
          score: source.score,
          canFulfilEntireQuantity: source.canFulfilEntireQuantity,
        })),

        shortageDetails: {
          part: part._id,
          requiredQuantity: shortageQuantity,
          availableQuantity: localAvailableQuantity,
        },

        proposedSource,
        proposedSources,
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
    const repairOrders = await RepairOrder.find({
      dealership: req.user.dealership,
    }).select("_id");

    const repairOrderIds = repairOrders.map((order) => order._id);

    const recommendations = await Recommendation.find({
      repairOrder: { $in: repairOrderIds },
    })
      .populate("repairOrder")
      .populate("shortageDetails.part")
      .populate("proposedSource.dealership")
      .populate("proposedSource.vendor")
      .populate("proposedSources.dealership")
      .populate("proposedSources.vendor")
      .populate("proposedSchedule.technician")
      .populate("proposedSchedule.serviceBay")
      .populate("proposedSchedule.repairOrderToMoveForward")
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
