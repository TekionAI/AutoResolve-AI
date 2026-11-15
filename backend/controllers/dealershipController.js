
const Dealership = require("../models/Dealership");

// Create a new dealership
const createDealership = async (req, res) => {
  try {
    const dealership = await Dealership.create(req.body);

    res.status(201).json({
      success: true,
      message: "Dealership created successfully",
      data: dealership,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all dealerships
const getAllDealerships = async (req, res) => {
  try {
    const dealerships = await Dealership.find();

    res.status(200).json({
      success: true,
      count: dealerships.length,
      data: dealerships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get dealership by ID
const getDealershipById = async (req, res) => {
  try {
    const dealership = await Dealership.findById(req.params.id);

    if (!dealership) {
      return res.status(404).json({
        success: false,
        message: "Dealership not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dealership,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDealership,
  getAllDealerships,
  getDealershipById,
};
