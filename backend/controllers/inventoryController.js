
const Inventory = require("../models/Inventory");

// Add inventory to the logged-in user's dealership
const createInventory = async (req, res) => {
  try {
    const inventory = await Inventory.create({
      ...req.body,
      dealership: req.user.dealership,
    });

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

// Get inventory for the logged-in user's dealership
const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({
      dealership: req.user.dealership,
    })
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
// Get network-wide inventory for Managers
const getNetworkInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({})
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
    if (
      String(req.params.dealershipId) !==
      String(req.user.dealership)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this dealership's inventory.",
      });
    }

    const inventory = await Inventory.find({
      dealership: req.user.dealership,
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

// Update inventory belonging to the logged-in user's dealership
const updateInventory = async (req, res) => {
  try {
    const updateData = { ...req.body };

    delete updateData.dealership;
    delete updateData._id;

    const inventory = await Inventory.findOneAndUpdate(
      {
        _id: req.params.id,
        dealership: req.user.dealership,
      },
      {
        ...updateData,
        lastStockUpdate: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
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
  getNetworkInventory,
  getInventoryByDealership,
  updateInventory,
};
