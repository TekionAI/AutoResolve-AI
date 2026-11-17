
const Schedule = require("../models/Schedule");
const Technician = require("../models/Technician");
const ServiceBay = require("../models/ServiceBay");

const matchesCapability = (capabilities, requiredServices) => {
  return requiredServices.some((service) =>
    capabilities.some(
      (capability) =>
        capability.toLowerCase() === service.toLowerCase()
    )
  );
};

const countMatchingSkills = (skills, requiredServices) => {
  return requiredServices.filter((service) =>
    skills.some(
      (skill) =>
        skill.toLowerCase() === service.toLowerCase()
    )
  ).length;
};

const getRequiredServices = (repairOrder) => {
  const services = [
    ...repairOrder.operations.map((operation) => operation.name),
    ...repairOrder.requiredParts.map((item) => item.part.category),
  ];

  return [...new Set(services.filter(Boolean))];
};

const hasOverlap = (start, end, bookings) => {
  return bookings.some(
    (booking) =>
      start < new Date(booking.scheduledEnd) &&
      end > new Date(booking.scheduledStart)
  );
};

const findAvailableSlot = (
  durationMinutes,
  shiftStart,
  shiftEnd,
  technicianBookings,
  bayBookings
) => {
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dayOffset
    );

    const [startHour, startMinute] = shiftStart.split(":").map(Number);
    const [endHour, endMinute] = shiftEnd.split(":").map(Number);

    const shiftStartTime = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      startHour,
      startMinute
    );

    const shiftEndTime = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      endHour,
      endMinute
    );

    let candidateStart = new Date(
      Math.max(now.getTime(), shiftStartTime.getTime())
    );

    const minutes = candidateStart.getMinutes();
    const remainder = minutes % 15;

    if (remainder !== 0 || candidateStart.getSeconds() !== 0) {
      candidateStart.setMinutes(
        minutes + (15 - remainder),
        0,
        0
      );
    } else {
      candidateStart.setSeconds(0, 0);
    }

    while (true) {
      const candidateEnd = new Date(
        candidateStart.getTime() + durationMinutes * 60000
      );

      if (candidateEnd > shiftEndTime) {
        break;
      }

      const technicianConflict = hasOverlap(
        candidateStart,
        candidateEnd,
        technicianBookings
      );

      const bayConflict = hasOverlap(
        candidateStart,
        candidateEnd,
        bayBookings
      );

      if (!technicianConflict && !bayConflict) {
        return {
          scheduledStart: candidateStart,
          scheduledEnd: candidateEnd,
        };
      }

      candidateStart = new Date(
        candidateStart.getTime() + 15 * 60000
      );
    }
  }

  return null;
};

const findBestSchedule = async (repairOrder) => {
  const dealershipId =
    repairOrder.dealership?._id || repairOrder.dealership;

  if (!dealershipId) {
    throw new Error("Repair order dealership is missing");
  }

  const requiredServices = getRequiredServices(repairOrder);

  const durationMinutes = repairOrder.operations.reduce(
    (total, operation) => total + operation.estimatedDuration,
    0
  );

  if (durationMinutes <= 0) {
    throw new Error("Repair order has no valid operation duration");
  }

  const technicians = await Technician.find({
    dealership: dealershipId,
    availabilityStatus: "Available",
    isActive: true,
  });

  const serviceBays = await ServiceBay.find({
    dealership: dealershipId,
    status: "Available",
    isActive: true,
  });

  const candidates = [];

  for (const technician of technicians) {
    const skillMatchCount = countMatchingSkills(
      technician.skills || [],
      requiredServices
    );

    if (skillMatchCount === 0) {
      continue;
    }

    for (const bay of serviceBays) {
      if (
        !matchesCapability(
          bay.supportedServices || [],
          requiredServices
        )
      ) {
        continue;
      }

      const technicianBookings = await Schedule.find({
        dealership: dealershipId,
        technician: technician._id,
        status: { $in: ["Scheduled", "In Progress", "Delayed"] },
      });

      const bayBookings = await Schedule.find({
        dealership: dealershipId,
        serviceBay: bay._id,
        status: { $in: ["Scheduled", "In Progress", "Delayed"] },
      });

      const slot = findAvailableSlot(
        durationMinutes,
        technician.shiftStart,
        technician.shiftEnd,
        technicianBookings,
        bayBookings
      );

      if (slot) {
        candidates.push({
          technician,
          bay,
          skillMatchCount,
          ...slot,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.skillMatchCount !== a.skillMatchCount) {
      return b.skillMatchCount - a.skillMatchCount;
    }

    return (
      a.scheduledStart.getTime() -
      b.scheduledStart.getTime()
    );
  });

  return candidates[0] || null;
};

module.exports = { findBestSchedule };
