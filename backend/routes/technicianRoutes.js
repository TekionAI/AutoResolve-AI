
const express = require("express");

const {
  createTechnician,
  getAllTechnicians,
  getTechniciansByDealership,
  getMyTechnicianDashboard,
  startMyJob,
  completeMyJob,
} = require("../controllers/technicianController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorize("Manager"), createTechnician);

router.get("/", protect, getAllTechnicians);

router.get(
  "/dealership/:dealershipId",
  protect,
  getTechniciansByDealership
);

router.get(
  "/me/dashboard",
  protect,
  authorize("Technician"),
  getMyTechnicianDashboard
);

router.patch(
  "/me/jobs/:repairOrderId/start",
  protect,
  authorize("Technician"),
  startMyJob
);

router.patch(
  "/me/jobs/:repairOrderId/complete",
  protect,
  authorize("Technician"),
  completeMyJob
);

module.exports = router;
