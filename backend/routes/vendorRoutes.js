
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

router.get(
  "/",
  protect,
  authorize("Manager", "Service Advisor"),
  getAllVendors
);

router.get(
  "/:id",
  protect,
  authorize("Manager", "Service Advisor"),
  getVendorById
);

module.exports = router;
