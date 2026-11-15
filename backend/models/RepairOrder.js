
const mongoose = require("mongoose");

const repairOrderSchema = new mongoose.Schema(
  {
    roNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
    },

    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
    },

    vehicle: {
      make: {
        type: String,
        default: "Maruti Suzuki",
      },
      model: {
        type: String,
        required: true,
      },
      registrationNumber: {
        type: String,
        required: true,
      },
      mileage: {
        type: Number,
        default: 0,
      },
    },

    operations: [
      {
        name: {
          type: String,
          required: true,
        },
        estimatedDuration: {
          type: Number,
          required: true,
        },
      },
    ],

    requiredParts: [
      {
        part: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },
        requiredQuantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Created",
        "Waiting for Parts",
        "Ready for Service",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Created",
    },

    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      default: null,
    },

    assignedBay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBay",
      default: null,
    },

    scheduledStart: {
      type: Date,
      default: null,
    },

    estimatedCompletion: {
      type: Date,
      default: null,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RepairOrder", repairOrderSchema);
