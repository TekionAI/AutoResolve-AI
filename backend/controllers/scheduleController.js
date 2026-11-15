const RepairOrder = require("../models/RepairOrder");
const Schedule = require("../models/Schedule");
const { findBestSchedule } = require("../services/schedulingService");

const generateSchedule = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findById(
      req.params.repairOrderId
    )
      .populate("dealership")
      .populate("requiredParts.part");

    if (!repairOrder) {
      return res.status(404).json({
        success: false,
        message: "Repair order not found",
      });
    }

    if (repairOrder.status !== "Ready for Service") {
      return res.status(400).json({
        success: false,
        message: "Only repair orders ready for service can be scheduled",
      });
    }

    const existingSchedule = await Schedule.findOne({
      repairOrder: repairOrder._id,
      status: { $in: ["Scheduled", "In Progress"] },
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "This repair order already has an active schedule",
        data: existingSchedule,
      });
    }

    const bestSlot = await findBestSchedule(repairOrder);

    if (!bestSlot) {
      return res.status(409).json({
        success: false,
        message:
          "No suitable technician, service bay or available time slot found",
      });
    }

    const durationMinutes = repairOrder.operations.reduce(
      (total, operation) => total + operation.estimatedDuration,
      0
    );

    const schedule = await Schedule.create({
      repairOrder: repairOrder._id,
      dealership: repairOrder.dealership._id,
      technician: bestSlot.technician._id,
      serviceBay: bestSlot.bay._id,
      scheduledStart: bestSlot.scheduledStart,
      scheduledEnd: bestSlot.scheduledEnd,
      status: "Scheduled",
      isRescheduledByAI: false,
    });

    repairOrder.assignedTechnician = bestSlot.technician._id;
    repairOrder.assignedBay = bestSlot.bay._id;
    repairOrder.scheduledStart = bestSlot.scheduledStart;
    repairOrder.estimatedCompletion = bestSlot.scheduledEnd;

    await repairOrder.save();

    return res.status(201).json({
      success: true,
      message: "Repair order scheduled successfully",
      data: {
        schedule,
        repairOrderNumber: repairOrder.roNumber,
        technician: bestSlot.technician.name,
        serviceBay: bestSlot.bay.bayNumber,
        durationMinutes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("repairOrder")
      .populate("technician")
      .populate("serviceBay")
      .populate("dealership")
      .sort({ scheduledStart: 1 });

    return res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateSchedule,
  getAllSchedules,
};