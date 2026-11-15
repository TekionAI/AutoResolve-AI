
const mongoose = require("mongoose");

const vendorInventorySchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },

    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedDeliveryHours: {
      type: Number,
      required: true,
      min: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

vendorInventorySchema.index(
  { vendor: 1, part: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "VendorInventory",
  vendorInventorySchema
);
