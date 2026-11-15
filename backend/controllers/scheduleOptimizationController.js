
const Recommendation = require("../models/Recommendation");

const {
  generateReschedulingOptions,
} = require("../services/scheduleOptimizationService");

const optimizeSchedule = async (req, res) => {
  try {
    const { dealershipId } = req.params;

    const options = await generateReschedulingOptions(dealershipId);

    const savedRecommendations = [];

    for (const option of options) {
      const recommendation = await Recommendation.findOneAndUpdate(
        {
          repairOrder: option.blockedRepairOrder._id,
          recommendationType: "Schedule Optimization",
          "proposedSchedule.repairOrderToMoveForward":
            option.repairOrderToMoveForward._id,
          status: "Pending",
        },
        {
          $set: {
            recommendationType: "Schedule Optimization",
            proposedSchedule: {
              repairOrderToMoveForward:
                option.repairOrderToMoveForward._id,
              proposedStart: option.proposedStart,
              proposedEnd: option.proposedEnd,
              technician: option.technician._id,
              serviceBay: option.serviceBay._id,
            },
            explanation: option.explanation,
            estimatedTimeSavedMinutes: 0,
            status: "Pending",
          },
          $setOnInsert: {
            repairOrder: option.blockedRepairOrder._id,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      savedRecommendations.push(recommendation);
    }

    return res.status(200).json({
      success: true,
      count: savedRecommendations.length,
      message: "Schedule optimization recommendations saved successfully",
      data: savedRecommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { optimizeSchedule };
