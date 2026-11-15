
const express = require("express");

const router = express.Router();

const {
  createDealership,
  getAllDealerships,
  getDealershipById,
} = require("../controllers/dealershipController");

// Create a dealership
router.post("/", createDealership);

// Get all dealerships
router.get("/", getAllDealerships);

// Get a dealership by ID
router.get("/:id", getDealershipById);

module.exports = router;
