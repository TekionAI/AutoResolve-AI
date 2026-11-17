
const mongoose = require("mongoose");
const Recommendation = require("../models/Recommendation");
const RepairOrder = require("../models/RepairOrder");

const reviewRecommendation = async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(recommendationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recommendation ID",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    const recommendation = await Recommendation.findById(
      recommendationId
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    const repairOrder = await RepairOrder.findOne({
      _id: recommendation.repairOrder,
      dealership: req.user.dealership,
    });

    if (!repairOrder) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found or access denied",
      });
    }

    const updatedRecommendation =
      await Recommendation.findOneAndUpdate(
        {
          _id: recommendationId,
          status: "Pending",
        },
        {
          $set: {
            status,
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedRecommendation) {
      return res.status(400).json({
        success: false,
        message: "Only pending recommendations can be reviewed",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Recommendation ${status.toLowerCase()} successfully`,
      data: updatedRecommendation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { reviewRecommendation };
