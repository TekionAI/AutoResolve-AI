const mongoose = require("mongoose");
const Recommendation = require("../models/Recommendation");
const RepairOrder = require("../models/RepairOrder");
const Schedule = require("../models/Schedule");
const Technician = require("../models/Technician");
const ServiceBay = require("../models/ServiceBay");

const matchesAnyCapability = (capabilities, requiredServices) => {
  return requiredServices.some((service) =>
    capabilities.some(
      (capability) =>
        capability.toLowerCase() === service.toLowerCase()
    )
  );
};

const getTimeInMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const applyScheduleRecommendation = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    let result;

    await session.withTransaction(async () => {
      const dealershipId = req.user.dealership;

      if (!mongoose.Types.ObjectId.isValid(req.params.recommendationId)) {
        throw new Error("Invalid recommendation ID");
      }

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

      const blockedRepairOrder = await RepairOrder.findOne({
        _id: recommendation.repairOrder,
        dealership: dealershipId,
      }).session(session);

      if (!blockedRepairOrder) {
        throw new Error("Recommendation not found or access denied");
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

      const repairOrder = await RepairOrder.findOne({
        _id: proposed.repairOrderToMoveForward,
        dealership: dealershipId,
      })
        .populate("requiredParts.part")
        .session(session);

      if (!repairOrder) {
        throw new Error("Repair order not found or access denied");
      }

      if (
        repairOrder.status !== "Ready for Service" ||
        repairOrder.isBlocked
      ) {
        throw new Error("Repair order is no longer ready for service");
      }

      const requiredServices = [
        ...repairOrder.operations.map((operation) => operation.name),
        ...repairOrder.requiredParts.map((item) => item.part?.category),
      ].filter(Boolean);

      if (requiredServices.length === 0) {
        throw new Error("No required services found for this repair order");
      }

      const technician = await Technician.findOne({
        _id: proposed.technician,
        dealership: dealershipId,
        isActive: true,
        availabilityStatus: "Available",
      }).session(session);

      if (!technician) {
        throw new Error("Technician not found or access denied");
      }

      if (
        !matchesAnyCapability(
          technician.skills || [],
          requiredServices
        )
      ) {
        throw new Error("Technician does not have the required skills");
      }

      const serviceBay = await ServiceBay.findOne({
        _id: proposed.serviceBay,
        dealership: dealershipId,
        isActive: true,
        status: "Available",
      }).session(session);

      if (!serviceBay) {
        throw new Error("Service bay not found or access denied");
      }

      if (
        !matchesAnyCapability(
          serviceBay.supportedServices || [],
          requiredServices
        )
      ) {
        throw new Error("Service bay does not support the required services");
      }

      const start = new Date(proposed.proposedStart);
      const end = new Date(proposed.proposedEnd);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        throw new Error("Invalid proposed schedule time");
      }

      const durationMinutes = repairOrder.operations.reduce(
        (total, operation) => total + operation.estimatedDuration,
        0
      );

      if (durationMinutes <= 0) {
        throw new Error("Repair order has no valid operation duration");
      }

      const proposedDuration = (end.getTime() - start.getTime()) / 60000;

      if (proposedDuration !== durationMinutes) {
        throw new Error("Proposed slot does not match repair duration");
      }

      if (start.toDateString() !== end.toDateString()) {
        throw new Error("Proposed schedule must fit within one shift");
      }

      const shiftStart = getTimeInMinutes(technician.shiftStart);
      const shiftEnd = getTimeInMinutes(technician.shiftEnd);

      const proposedStartMinutes =
        start.getHours() * 60 + start.getMinutes();

      const proposedEndMinutes =
        end.getHours() * 60 + end.getMinutes();

      if (
        proposedStartMinutes < shiftStart ||
        proposedEndMinutes > shiftEnd
      ) {
        throw new Error("Proposed schedule is outside technician shift hours");
      }

      const activeStatuses = ["Scheduled", "In Progress", "Delayed"];

      const existingSchedule = await Schedule.findOne({
        repairOrder: repairOrder._id,
        dealership: dealershipId,
        status: { $in: activeStatuses },
      }).session(session);

      if (existingSchedule) {
        throw new Error("Repair order already has an active schedule");
      }

      const technicianConflict = await Schedule.findOne({
        dealership: dealershipId,
        technician: technician._id,
        status: { $in: activeStatuses },
        scheduledStart: { $lt: end },
        scheduledEnd: { $gt: start },
      }).session(session);

      if (technicianConflict) {
        throw new Error("Proposed technician is no longer available");
      }

      const bayConflict = await Schedule.findOne({
        dealership: dealershipId,
        serviceBay: serviceBay._id,
        status: { $in: activeStatuses },
        scheduledStart: { $lt: end },
        scheduledEnd: { $gt: start },
      }).session(session);

      if (bayConflict) {
        throw new Error("Proposed service bay is no longer available");
      }

      const updatedRecommendation =
        await Recommendation.findOneAndUpdate(
          {
            _id: recommendation._id,
            status: "Approved",
          },
          {
            $set: {
              status: "Applied",
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

      if (!updatedRecommendation) {
        throw new Error("Recommendation has already been applied or reviewed");
      }

      const [schedule] = await Schedule.create(
        [
          {
            repairOrder: repairOrder._id,
            dealership: dealershipId,
            technician: technician._id,
            serviceBay: serviceBay._id,
            scheduledStart: start,
            scheduledEnd: end,
            status: "Scheduled",
            isRescheduledByAI: true,
            reschedulingReason: recommendation.explanation,
          },
        ],
        { session }
      );

      repairOrder.assignedTechnician = technician._id;
      repairOrder.assignedBay = serviceBay._id;
      repairOrder.scheduledStart = start;
      repairOrder.estimatedCompletion = end;
      repairOrder.isBlocked = false;
      repairOrder.blockedReason = null;

      await repairOrder.save({ session });

      result = {
        schedule,
        repairOrder,
        recommendation: updatedRecommendation,
      };
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
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = { applyScheduleRecommendation };
