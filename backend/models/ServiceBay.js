
const mongoose = require("mongoose");

const serviceBaySchema = new mongoose.Schema(
  {
    bayNumber: {
      type: String,
      required: true,
    },

    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
    },

    supportedServices: [
      {
        type: String,
      },
    ],

    bayType: {
      type: String,
      enum: ["General", "Mechanical", "Electrical", "Quick Service"],
      default: "General",
    },

    status: {
      type: String,
      enum: ["Available", "Occupied", "Maintenance"],
      default: "Available",
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

serviceBaySchema.index(
  { dealership: 1, bayNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("ServiceBay", serviceBaySchema);
