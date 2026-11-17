
const Part = require("../models/Parts");
const Inventory = require("../models/Inventory");
const VendorInventory = require("../models/VendorInventory");
const RepairOrder = require("../models/RepairOrder");
const Recommendation = require("../models/Recommendation");

// Create a new part
const createPart = async (req, res) => {
  try {
    const {
      partNumber,
      name,
      category,
      description,
      compatibleVehicles,
      unitPrice,
    } = req.body;

    const part = await Part.create({
      partNumber,
      name,
      category,
      description,
      compatibleVehicles,
      unitPrice,
    });

    return res.status(201).json({
      success: true,
      message: "Part created successfully",
      data: part,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all active parts
const getAllParts = async (req, res) => {
  try {
    const parts = await Part.find({ isActive: true });

    return res.status(200).json({
      success: true,
      count: parts.length,
      data: parts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get active part by ID
const getPartById = async (req, res) => {
  try {
    const part = await Part.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Part not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: part,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a part
const updatePart = async (req, res) => {
  try {
    const {
      partNumber,
      name,
      category,
      description,
      compatibleVehicles,
      unitPrice,
    } = req.body;

    const updateData = {};

    if (partNumber !== undefined) updateData.partNumber = partNumber;
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (compatibleVehicles !== undefined) {
      updateData.compatibleVehicles = compatibleVehicles;
    }
    if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
    if (Object.keys(updateData).length === 0) {
  return res.status(400).json({
    success: false,
    message: "No valid fields provided for update",
  });
}

    const part = await Part.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Active part not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Part updated successfully",
      data: part,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Soft delete a part
const deletePart = async (req, res) => {
  try {
    const part = await Part.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Active part not found",
      });
    }

    const [inventoryExists, vendorInventoryExists, repairOrderExists, recommendationExists] =
      await Promise.all([
        Inventory.exists({ part: part._id }),
        VendorInventory.exists({ part: part._id }),
        RepairOrder.exists({ "requiredParts.part": part._id }),
        Recommendation.exists({
          "shortageDetails.part": part._id,
        }),
      ]);

    const isReferenced =
      inventoryExists ||
      vendorInventoryExists ||
      repairOrderExists ||
      recommendationExists;

    part.isActive = false;
    await part.save();

    return res.status(200).json({
      success: true,
      message: isReferenced
        ? "Part deactivated successfully. Historical records have been preserved."
        : "Part deactivated successfully.",
      data: {
        partId: part._id,
        isActive: part.isActive,
        hasExistingReferences: isReferenced,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  deletePart,
};
