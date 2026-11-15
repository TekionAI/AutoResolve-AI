
const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    repairOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RepairOrder",
      required: true,
    },
    recommendationType: {
      type: String,
      enum: ["Parts Sourcing", "Schedule Optimization", "Combined"],
      required: true,
    },
    shortageDetails: {
      part: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Part",
        default: null,
      },
      requiredQuantity: {
        type: Number,
        default: 0,
      },
      availableQuantity: {
        type: Number,
        default: 0,
      },
    },
    proposedSource: {
      sourceType: {
        type: String,
        enum: ["Sister Dealership", "Vendor", null],
        default: null,
      },
      dealership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dealership",
        default: null,
      },
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        default: null,
      },
      quantity: {
        type: Number,
        default: 0,
      },
      estimatedDeliveryHours: {
        type: Number,
        default: null,
      },
      estimatedCost: {
        type: Number,
        default: null,
      },
    },
    
proposedSchedule: {
  repairOrderToMoveForward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RepairOrder",
    default: null,
  },
  proposedStart: { type: Date, default: null },
  proposedEnd: { type: Date, default: null },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Technician",
    default: null,
  },
  serviceBay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceBay",
    default: null,
  },
},

    explanation: {
      type: String,
      required: true,
    },
    estimatedTimeSavedMinutes: {
      type: Number,
      default: 0,
    },
    estimatedCostSaved: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Applied"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
