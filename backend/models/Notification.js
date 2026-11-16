
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "PARTS_SHORTAGE",
        "SOURCING_RECOMMENDATION",
        "APPROVAL_REQUIRED",
        "INVENTORY_TRANSFER",
        "REPAIR_ORDER_UNBLOCKED",
        "JOB_ASSIGNED",
        "JOB_COMPLETED",
        "GENERAL",
      ],
      default: "GENERAL",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    relatedEntity: {
      entityType: {
        type: String,
        enum: ["RepairOrder", "Recommendation", "Schedule", "Inventory"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
