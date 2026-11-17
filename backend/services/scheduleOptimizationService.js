
const RepairOrder = require("../models/RepairOrder");
const Schedule = require("../models/Schedule");
const { findBestSchedule } = require("./schedulingService");

const priorityRank = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const getReadyRepairOrders = async (dealershipId) => {
  return RepairOrder.find({
    dealership: dealershipId,
    status: "Ready for Service",
  }).populate("requiredParts.part");
};

const getBlockedRepairOrders = async (dealershipId) => {
  return RepairOrder.find({
    dealership: dealershipId,
    status: "Waiting for Parts",
    isBlocked: true,
  });
};

const generateReschedulingOptions = async (dealershipId) => {
  const blockedOrders = await getBlockedRepairOrders(dealershipId);
  const readyOrders = await getReadyRepairOrders(dealershipId);

  readyOrders.sort(
    (a, b) =>
      (priorityRank[b.priority] || 0) -
      (priorityRank[a.priority] || 0)
  );

  const usedRepairOrders = new Set();
  const recommendations = [];

  for (const blockedOrder of blockedOrders) {
    for (const readyOrder of readyOrders) {
      if (usedRepairOrders.has(readyOrder._id.toString())) {
        continue;
      }

      const existingSchedule = await Schedule.findOne({
        repairOrder: readyOrder._id,
        dealership: dealershipId,
        status: { $in: ["Scheduled", "In Progress", "Delayed"] },
      });

      if (existingSchedule) {
        continue;
      }

      const slot = await findBestSchedule(readyOrder);

      if (!slot) {
        continue;
      }

      recommendations.push({
        blockedRepairOrder: blockedOrder,
        repairOrderToMoveForward: readyOrder,
        proposedStart: slot.scheduledStart,
        proposedEnd: slot.scheduledEnd,
        technician: slot.technician,
        serviceBay: slot.bay,
        explanation:
          `${readyOrder.roNumber} is ready for service and can be scheduled ` +
          `while ${blockedOrder.roNumber} waits for parts.`,
      });

      usedRepairOrders.add(readyOrder._id.toString());
      break;
    }
  }

  return recommendations;
};

module.exports = {
  getReadyRepairOrders,
  getBlockedRepairOrders,
  generateReschedulingOptions,
};
