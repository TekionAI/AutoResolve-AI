
const express = require("express");
const router = express.Router();

const {
  createVendor,
  getAllVendors,
  getVendorById,
} = require("../controllers/vendorController");

router.post("/", createVendor);
router.get("/", getAllVendors);
router.get("/:id", getVendorById);

module.exports = router;
