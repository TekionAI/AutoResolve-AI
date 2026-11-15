
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    repairOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RepairOrder",
      required: true,
    },
    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },
    serviceBay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBay",
      required: true,
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    actualStart: {
      type: Date,
      default: null,
    },
    actualEnd: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Delayed", "Cancelled"],
      default: "Scheduled",
    },
    isRescheduledByAI: {
      type: Boolean,
      default: false,
    },
    reschedulingReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ technician: 1, scheduledStart: 1 });
scheduleSchema.index({ serviceBay: 1, scheduledStart: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
