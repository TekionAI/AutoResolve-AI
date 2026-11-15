const ServiceBay = require("../models/ServiceBay");

const createServiceBay = async (req, res) => {
  try {
    const serviceBay = await ServiceBay.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Service bay created successfully",
      data: serviceBay,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllServiceBays = async (req, res) => {
  try {
    const serviceBays = await ServiceBay.find()
      .populate("dealership")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: serviceBays.length,
      data: serviceBays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getServiceBaysByDealership = async (req, res) => {
  try {
    const serviceBays = await ServiceBay.find({
      dealership: req.params.dealershipId,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      count: serviceBays.length,
      data: serviceBays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createServiceBay,
  getAllServiceBays,
  getServiceBaysByDealership,
};