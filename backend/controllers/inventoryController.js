
const Inventory = require("../models/Inventory");

// Add inventory to a dealership
const createInventory = async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      message: "Inventory added successfully",
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all dealership inventory
const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("dealership", "name dealershipCode")
      .populate("part", "partNumber name category unitPrice");

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get inventory for a particular dealership
const getInventoryByDealership = async (req, res) => {
  try {
    const inventory = await Inventory.find({
      dealership: req.params.dealershipId,
    })
      .populate("dealership", "name dealershipCode")
      .populate("part", "partNumber name category unitPrice");

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update inventory quantity
const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastStockUpdate: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createInventory,
  getAllInventory,
  getInventoryByDealership,
  updateInventory,
};
