
const express = require("express");
const router = express.Router();

const {
  createVendorInventory,
  getAllVendorInventory,
  getVendorInventoryByPart,
  updateVendorInventory,
} = require("../controllers/vendorInventoryController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post("/", protect, authorize("Manager"), createVendorInventory);

router.get(
  "/",
  protect,
  authorize("Manager", "Service Advisor"),
  getAllVendorInventory
);

router.get(
  "/part/:partId",
  protect,
  authorize("Manager", "Service Advisor"),
  getVendorInventoryByPart
);

router.put("/:id", protect, authorize("Manager"), updateVendorInventory);

module.exports = router;
