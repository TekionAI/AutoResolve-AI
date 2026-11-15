
const express = require("express");

const {
  optimizeSchedule,
} = require("../controllers/scheduleOptimizationController");

const {
  generateSchedule,
  getAllSchedules,
} = require("../controllers/scheduleController");

const {
  applyScheduleRecommendation,
} = require("../controllers/scheduleApplicationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getAllSchedules);

router.post(
  "/generate/:repairOrderId",
  protect,
  authorize("Manager", "Service Advisor"),
  generateSchedule
);

router.post(
  "/optimize/:dealershipId",
  protect,
  authorize("Manager", "Service Advisor"),
  optimizeSchedule
);

router.put(
  "/apply-recommendation/:recommendationId",
  protect,
  authorize("Manager"),
  applyScheduleRecommendation
);

module.exports = router;
