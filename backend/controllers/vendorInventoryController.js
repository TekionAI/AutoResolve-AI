
const VendorInventory = require("../models/VendorInventory");

// Add vendor stock
const createVendorInventory = async (req, res) => {
  try {
    const inventory = await VendorInventory.create(req.body);

    res.status(201).json({
      success: true,
      message: "Vendor inventory added successfully",
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all vendor stock
const getAllVendorInventory = async (req, res) => {
  try {
    const inventory = await VendorInventory.find()
      .populate("vendor", "name vendorCode address averageDeliveryTime reliabilityScore")
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

// Find vendors supplying a particular part
const getVendorInventoryByPart = async (req, res) => {
  try {
    const inventory = await VendorInventory.find({
      part: req.params.partId,
      isAvailable: true,
      availableQuantity: { $gt: 0 },
    })
      .populate("vendor", "name vendorCode address averageDeliveryTime reliabilityScore")
      .populate("part", "partNumber name category");

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

// Update vendor stock
const updateVendorInventory = async (req, res) => {
  try {
    const inventory = await VendorInventory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastUpdated: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Vendor inventory not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor inventory updated successfully",
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
  createVendorInventory,
  getAllVendorInventory,
  getVendorInventoryByPart,
  updateVendorInventory,
};
