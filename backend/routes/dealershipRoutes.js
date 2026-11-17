
const express = require("express");

const router = express.Router();

const {
  createDealership,
  getAllDealerships,
  getDealershipById,
} = require("../controllers/dealershipController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Manager-only dealership creation
router.post("/", protect, authorize("Manager"), createDealership);

// Authenticated users can view dealerships
router.get("/", protect, getAllDealerships);

// Authenticated users can view a dealership by ID
router.get("/:id", protect, getDealershipById);

module.exports = router;
