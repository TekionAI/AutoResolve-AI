
const mongoose = require("mongoose");
const RepairOrder = require("../models/RepairOrder");
const Schedule = require("../models/Schedule");
const Technician = require("../models/Technician");

const createTechnician = async (req, res) => {
  try {
    const technician = await Technician.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Technician created successfully",
      data: technician,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find()
      .populate("dealership")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTechniciansByDealership = async (req, res) => {
  try {
    const technicians = await Technician.find({
      dealership: req.params.dealershipId,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyTechnicianDashboard = async (req, res) => {
  try {
    if (!req.user.technician) {
      return res.status(404).json({
        success: false,
        message: "No technician profile is linked to this account",
      });
    }

    const technician = await Technician.findOne({
      _id: req.user.technician,
      dealership: req.user.dealership,
      isActive: true,
    }).populate("dealership", "name");

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found",
      });
    }

    const jobs = await RepairOrder.find({
      assignedTechnician: technician._id,
      dealership: req.user.dealership,
    })
      .populate("requiredParts.part")
      .populate("assignedBay")
      .sort({ scheduledStart: 1 });

    const schedules = await Schedule.find({
      technician: technician._id,
      dealership: req.user.dealership,
    })
      .populate({
        path: "repairOrder",
        populate: {
          path: "requiredParts.part",
        },
      })
      .populate("serviceBay")
      .sort({ scheduledStart: 1 });

    const summary = {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((job) =>
        ["Created", "Ready for Service"].includes(job.status)
      ).length,
      inProgressJobs: jobs.filter(
        (job) => job.status === "In Progress"
      ).length,
      completedJobs: jobs.filter(
        (job) => job.status === "Completed"
      ).length,
      blockedJobs: jobs.filter((job) => job.isBlocked).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        technician,
        summary,
        jobs,
        schedules,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const startMyJob = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const technician = await Technician.findOne({
        _id: req.user.technician,
        dealership: req.user.dealership,
        isActive: true,
      }).session(session);

      if (!technician) {
        const error = new Error("Technician profile not found");
        error.statusCode = 404;
        throw error;
      }

      if (technician.availabilityStatus !== "Available") {
        const error = new Error(
          "Technician is not currently available"
        );
        error.statusCode = 409;
        throw error;
      }

      const repairOrder = await RepairOrder.findOne({
        _id: req.params.repairOrderId,
        assignedTechnician: technician._id,
        dealership: req.user.dealership,
      }).session(session);

      if (!repairOrder) {
        const error = new Error(
          "Repair order not found or not assigned to you"
        );
        error.statusCode = 404;
        throw error;
      }

      if (repairOrder.isBlocked) {
        const error = new Error(
          "Cannot start a blocked repair order"
        );
        error.statusCode = 400;
        throw error;
      }

      if (repairOrder.status !== "Ready for Service") {
        const error = new Error(
          "Only repair orders ready for service can be started"
        );
        error.statusCode = 400;
        throw error;
      }

      const activeSchedule = await Schedule.findOne({
        technician: technician._id,
        status: "In Progress",
      }).session(session);

      if (activeSchedule) {
        const error = new Error(
          "You already have a job in progress"
        );
        error.statusCode = 409;
        throw error;
      }

      const schedule = await Schedule.findOne({
        repairOrder: repairOrder._id,
        technician: technician._id,
        dealership: req.user.dealership,
        status: { $in: ["Scheduled", "Delayed"] },
      }).session(session);

      if (!schedule) {
        const error = new Error(
          "No active schedule found for this repair order"
        );
        error.statusCode = 404;
        throw error;
      }
      if (new Date() < schedule.scheduledStart) {
  const error = new Error(
    "This job cannot be started before its scheduled time"
  );
  error.statusCode = 400;
  throw error;
}

      const now = new Date();

      schedule.status = "In Progress";
      schedule.actualStart = now;
      await schedule.save({ session });

      repairOrder.status = "In Progress";
      await repairOrder.save({ session });

      technician.availabilityStatus = "Busy";
      await technician.save({ session });

      result = {
        repairOrder,
        schedule,
        technician,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Repair job started successfully",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

const completeMyJob = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const technician = await Technician.findOne({
        _id: req.user.technician,
        dealership: req.user.dealership,
        isActive: true,
      }).session(session);

      if (!technician) {
        const error = new Error("Technician profile not found");
        error.statusCode = 404;
        throw error;
      }

      const repairOrder = await RepairOrder.findOne({
        _id: req.params.repairOrderId,
        assignedTechnician: technician._id,
        dealership: req.user.dealership,
      }).session(session);

      if (!repairOrder) {
        const error = new Error(
          "Repair order not found or not assigned to you"
        );
        error.statusCode = 404;
        throw error;
      }

      if (repairOrder.status !== "In Progress") {
        const error = new Error(
          "Only jobs currently in progress can be completed"
        );
        error.statusCode = 400;
        throw error;
      }

      const schedule = await Schedule.findOne({
        repairOrder: repairOrder._id,
        technician: technician._id,
        dealership: req.user.dealership,
        status: "In Progress",
      }).session(session);

      if (!schedule) {
        const error = new Error(
          "No in-progress schedule found for this repair order"
        );
        error.statusCode = 404;
        throw error;
      }

      const now = new Date();

      schedule.status = "Completed";
      schedule.actualEnd = now;
      await schedule.save({ session });

      repairOrder.status = "Completed";
      await repairOrder.save({ session });

      const otherActiveJobs = await Schedule.countDocuments({
        technician: technician._id,
        status: "In Progress",
        _id: { $ne: schedule._id },
      }).session(session);

      technician.availabilityStatus = otherActiveJobs > 0
        ? "Busy"
        : "Available";

      await technician.save({ session });

      result = {
        repairOrder,
        schedule,
        technician,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Repair job completed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createTechnician,
  getAllTechnicians,
  getTechniciansByDealership,
  getMyTechnicianDashboard,
  startMyJob,
  completeMyJob,
};
