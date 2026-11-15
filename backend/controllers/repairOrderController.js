
const RepairOrder = require("../models/RepairOrder");
require("../models/Technician");
require("../models/ServiceBay");

// Create a repair order
const createRepairOrder = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.create(req.body);

    res.status(201).json({
      success: true,
      message: "Repair order created successfully",
      data: repairOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all repair orders
const getAllRepairOrders = async (req, res) => {
  try {
    const repairOrders = await RepairOrder.find()
      .populate("dealership", "name dealershipCode")
      .populate("requiredParts.part", "partNumber name unitPrice")
      .populate("assignedTechnician", "name employeeId")
      .populate("assignedBay", "bayNumber bayType");

    res.status(200).json({
      success: true,
      count: repairOrders.length,
      data: repairOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get repair order by ID
const getRepairOrderById = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findById(req.params.id)
      .populate("dealership", "name dealershipCode")
      .populate("requiredParts.part", "partNumber name unitPrice")
      .populate("assignedTechnician", "name employeeId")
      .populate("assignedBay", "bayNumber bayType");

    if (!repairOrder) {
      return res.status(404).json({
        success: false,
        message: "Repair order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: repairOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update repair order
const updateRepairOrder = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!repairOrder) {
      return res.status(404).json({
        success: false,
        message: "Repair order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Repair order updated successfully",
      data: repairOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRepairOrder,
  getAllRepairOrders,
  getRepairOrderById,
  updateRepairOrder,
};
