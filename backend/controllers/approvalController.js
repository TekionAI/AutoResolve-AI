
const Recommendation = require("../models/Recommendation");

const reviewRecommendation = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    const recommendation = await Recommendation.findById(
      req.params.recommendationId
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    if (recommendation.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending recommendations can be reviewed",
      });
    }

    recommendation.status = status;
    recommendation.reviewedBy = req.user._id;
    recommendation.reviewedAt = new Date();

    await recommendation.save();

    return res.status(200).json({
      success: true,
      message: `Recommendation ${status.toLowerCase()} successfully`,
      data: recommendation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { reviewRecommendation };
