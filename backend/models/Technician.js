
const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
    },

    skills: [
      {
        type: String,
      },
    ],

    availabilityStatus: {
      type: String,
      enum: ["Available", "Busy", "On Leave"],
      default: "Available",
    },

    shiftStart: {
      type: String,
      default: "09:00",
    },

    shiftEnd: {
      type: String,
      default: "18:00",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Technician", technicianSchema);
