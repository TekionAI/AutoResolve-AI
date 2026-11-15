
const express = require("express");

const router = express.Router();

const {
  createInventory,
  getAllInventory,
  getInventoryByDealership,
  updateInventory,
} = require("../controllers/inventoryController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post("/", protect, authorize("Manager"), createInventory);
router.get("/", protect, getAllInventory);
router.get("/dealership/:dealershipId", protect, getInventoryByDealership);
router.put("/:id", protect, authorize("Manager"), updateInventory);
module.exports = router;
