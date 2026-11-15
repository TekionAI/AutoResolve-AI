const Technician = require("../models/Technician");

const createTechnician = async (req, res) => {
  try {
    const technician = await Technician.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Technician created successfully",
      data: technician,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find()
      .populate("dealership")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTechniciansByDealership = async (req, res) => {
  try {
    const technicians = await Technician.find({
      dealership: req.params.dealershipId,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTechnician,
  getAllTechnicians,
  getTechniciansByDealership,
};