
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
    },
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservations: [
      {
        repairOrder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RepairOrder",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

inventorySchema.index(
  { dealership: 1, part: 1 },
  { unique: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
