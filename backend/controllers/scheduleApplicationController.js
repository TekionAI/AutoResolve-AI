
const mongoose = require("mongoose");
const Recommendation = require("../models/Recommendation");
const RepairOrder = require("../models/RepairOrder");
const Schedule = require("../models/Schedule");

const applyScheduleRecommendation = async (req, res) => {
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

      if (recommendation.recommendationType !== "Schedule Optimization") {
        throw new Error("This is not a schedule optimization recommendation");
      }

      if (recommendation.status !== "Approved") {
        throw new Error("Only approved recommendations can be applied");
      }

      const proposed = recommendation.proposedSchedule;

      if (
        !proposed.repairOrderToMoveForward ||
        !proposed.technician ||
        !proposed.serviceBay ||
        !proposed.proposedStart ||
        !proposed.proposedEnd
      ) {
        throw new Error("Incomplete proposed schedule details");
      }

      const repairOrder = await RepairOrder.findById(
        proposed.repairOrderToMoveForward
      ).session(session);

      if (!repairOrder) {
        throw new Error("Repair order to schedule was not found");
      }

      if (repairOrder.status !== "Ready for Service") {
        throw new Error("Repair order is no longer ready for service");
      }

      const start = new Date(proposed.proposedStart);
      const end = new Date(proposed.proposedEnd);

      if (end <= start) {
        throw new Error("Invalid proposed schedule time");
      }

      const activeStatuses = ["Scheduled", "In Progress", "Delayed"];

      const existingSchedule = await Schedule.findOne({
        repairOrder: repairOrder._id,
        status: { $in: activeStatuses },
      }).session(session);

      if (existingSchedule) {
        throw new Error("Repair order already has an active schedule");
      }

      const technicianConflict = await Schedule.findOne({
        technician: proposed.technician,
        status: { $in: activeStatuses },
        scheduledStart: { $lt: end },
        scheduledEnd: { $gt: start },
      }).session(session);

      if (technicianConflict) {
        throw new Error("Proposed technician is no longer available");
      }

      const bayConflict = await Schedule.findOne({
        serviceBay: proposed.serviceBay,
        status: { $in: activeStatuses },
        scheduledStart: { $lt: end },
        scheduledEnd: { $gt: start },
      }).session(session);

      if (bayConflict) {
        throw new Error("Proposed service bay is no longer available");
      }

      const [schedule] = await Schedule.create(
        [
          {
            repairOrder: repairOrder._id,
            dealership: repairOrder.dealership,
            technician: proposed.technician,
            serviceBay: proposed.serviceBay,
            scheduledStart: start,
            scheduledEnd: end,
            status: "Scheduled",
            isRescheduledByAI: true,
            reschedulingReason: recommendation.explanation,
          },
        ],
        { session }
      );

      repairOrder.assignedTechnician = proposed.technician;
      repairOrder.assignedBay = proposed.serviceBay;
      repairOrder.scheduledStart = start;
      repairOrder.estimatedCompletion = end;
      repairOrder.isBlocked = false;
      repairOrder.blockedReason = null;

      await repairOrder.save({ session });

      recommendation.status = "Applied";
      await recommendation.save({ session });

      result = { schedule, repairOrder };
    });

    return res.status(200).json({
      success: true,
      message: "Approved scheduling recommendation applied successfully",
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

module.exports = { applyScheduleRecommendation };
