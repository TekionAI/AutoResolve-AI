
const express = require("express");

const router = express.Router();

const {
  createRepairOrder,
  getAllRepairOrders,
  getRepairOrderById,
  updateRepairOrder,
} = require("../controllers/repairOrderController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");


router.post("/", protect, authorize("Manager", "Service Advisor"), createRepairOrder);
router.get("/", protect, getAllRepairOrders);
router.get("/:id", protect, getRepairOrderById);
router.put("/:id", protect, authorize("Manager", "Service Advisor"), updateRepairOrder);

module.exports = router;
