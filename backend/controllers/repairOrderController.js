
const mongoose = require("mongoose");

const RepairOrder = require("../models/RepairOrder");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const User = require("../models/User");

require("../models/Technician");
require("../models/ServiceBay");

const createRepairOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let createdRepairOrder;

    await session.withTransaction(async () => {
      const orderData = { ...req.body };

      if (
        !Array.isArray(orderData.requiredParts) ||
        orderData.requiredParts.length === 0
      ) {
        throw new Error("At least one required part must be specified");
      }

      const requiredPartsMap = new Map();

      for (const item of orderData.requiredParts) {
        const partId = item.part;
        const requiredQuantity = Number(item.requiredQuantity);

        if (
          !partId ||
          !Number.isInteger(requiredQuantity) ||
          requiredQuantity < 1
        ) {
          throw new Error("Invalid required part or quantity");
        }

        const key = partId.toString();

        if (!requiredPartsMap.has(key)) {
          requiredPartsMap.set(key, {
            part: partId,
            requiredQuantity: 0,
          });
        }

        requiredPartsMap.get(key).requiredQuantity += requiredQuantity;
      }

      const shortages = [];
      const reservedItems = [];

      for (const item of requiredPartsMap.values()) {
        const inventory = await Inventory.findOne({
          dealership: orderData.dealership,
          part: item.part,
        }).session(session);

        const availableQuantity = inventory
          ? Math.max(
              0,
              inventory.quantity - inventory.reservedQuantity
            )
          : 0;

        const quantityToReserve = Math.min(
          item.requiredQuantity,
          availableQuantity
        );

        if (quantityToReserve > 0) {
          inventory.reservedQuantity += quantityToReserve;

          reservedItems.push({
            inventory,
            part: item.part,
            quantity: quantityToReserve,
          });
        }

        if (quantityToReserve < item.requiredQuantity) {
          shortages.push({
            part: item.part,
            requiredQuantity: item.requiredQuantity,
            availableQuantity: quantityToReserve,
            shortageQuantity:
              item.requiredQuantity - quantityToReserve,
          });
        }
      }

      orderData.status =
        shortages.length > 0
          ? "Waiting for Parts"
          : "Ready for Service";

      orderData.isBlocked = shortages.length > 0;

      orderData.blockedReason =
        shortages.length > 0
          ? `Insufficient stock for ${shortages.length} required part(s)`
          : null;

      const repairOrders = await RepairOrder.create(
        [orderData],
        { session }
      );

      createdRepairOrder = repairOrders[0];

      // Save stock reservations against this specific repair order.
      for (const item of reservedItems) {
        item.inventory.reservations.push({
          repairOrder: createdRepairOrder._id,
          quantity: item.quantity,
        });

        await item.inventory.save({ session });
      }

      if (shortages.length > 0) {
        const recipients = await User.find({
          dealership: orderData.dealership,
          role: { $in: ["Manager", "Service Advisor"] },
          isActive: true,
        })
          .select("_id")
          .session(session);

        const notifications = recipients.map((recipient) => ({
          recipient: recipient._id,
          dealership: orderData.dealership,
          type: "PARTS_SHORTAGE",
          title: "Parts Shortage Detected",
          message: `Repair order ${createdRepairOrder.roNumber} has ${shortages.length} part(s) with insufficient local stock.`,
          relatedEntity: {
            entityType: "RepairOrder",
            entityId: createdRepairOrder._id,
          },
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications, { session });
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: "Repair order created successfully",
      data: createdRepairOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

const getAllRepairOrders = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "Technician") {
      if (!req.user.technician) {
        return res.status(403).json({
          success: false,
          message: "No technician profile is linked to this account",
        });
      }

      filter = {
        assignedTechnician: req.user.technician,
        dealership: req.user.dealership,
      };
    }

    const repairOrders = await RepairOrder.find(filter)
      .populate("dealership", "name dealershipCode")
      .populate("requiredParts.part", "partNumber name unitPrice")
      .populate("assignedTechnician", "name employeeId")
      .populate("assignedBay", "bayNumber bayType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairOrders.length,
      data: repairOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRepairOrderById = async (req, res) => {
  try {
    let filter = { _id: req.params.id };

    if (req.user.role === "Technician") {
      if (!req.user.technician) {
        return res.status(403).json({
          success: false,
          message: "No technician profile is linked to this account",
        });
      }

      filter.assignedTechnician = req.user.technician;
      filter.dealership = req.user.dealership;
    }

    const repairOrder = await RepairOrder.findOne(filter)
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

    return res.status(200).json({
      success: true,
      data: repairOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

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

    return res.status(200).json({
      success: true,
      message: "Repair order updated successfully",
      data: repairOrder,
    });
  } catch (error) {
    return res.status(400).json({
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
