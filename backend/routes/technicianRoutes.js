
const express = require("express");

const {
  createTechnician,
  getAllTechnicians,
  getTechniciansByDealership,
} = require("../controllers/technicianController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorize("Manager"), createTechnician);
router.get("/", protect, getAllTechnicians);
router.get("/dealership/:dealershipId", protect, getTechniciansByDealership);

module.exports = router;
