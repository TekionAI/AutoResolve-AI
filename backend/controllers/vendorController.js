
const mongoose = require("mongoose");
const Vendor = require("../models/Vendor");

// Create vendor
const createVendor = async (req, res) => {
  try {
    const {
      vendorCode,
      name,
      contactPerson,
      contactNumber,
      email,
      address,
      averageDeliveryTime,
      reliabilityScore,
    } = req.body;

    const vendor = await Vendor.create({
      vendorCode,
      name,
      contactPerson,
      contactNumber,
      email,
      address: address
        ? {
            city: address.city,
            state: address.state,
            fullAddress: address.fullAddress,
          }
        : undefined,
      averageDeliveryTime,
      reliabilityScore,
    });

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all active vendors
const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get active vendor by ID
const getVendorById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
};
