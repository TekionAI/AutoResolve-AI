
const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    vendorCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
    },

    contactPerson: {
      type: String,
    },

    contactNumber: {
      type: String,
    },

    email: {
      type: String,
    },

    address: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      fullAddress: {
        type: String,
      },
    },

    averageDeliveryTime: {
      type: Number,
      default: 24,
      min: 0,
    },

    reliabilityScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
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

module.exports = mongoose.model("Vendor", vendorSchema);
