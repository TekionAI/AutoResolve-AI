
const express = require("express");
const router = express.Router();

const {
  createVendor,
  getAllVendors,
  getVendorById,
} = require("../controllers/vendorController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
router.post("/", protect, authorize("Manager"), createVendor);
router.get("/", protect, getAllVendors);
router.get("/:id", protect, getVendorById);


module.exports = router;
