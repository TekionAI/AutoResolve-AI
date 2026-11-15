
const express = require("express");
const router = express.Router();

const {
  createVendorInventory,
  getAllVendorInventory,
  getVendorInventoryByPart,
  updateVendorInventory,
} = require("../controllers/vendorInventoryController");

router.post("/", createVendorInventory);
router.get("/", getAllVendorInventory);
router.get("/part/:partId", getVendorInventoryByPart);
router.put("/:id", updateVendorInventory);

module.exports = router;
