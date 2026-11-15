
const express = require("express");

const router = express.Router();

const {
  createRepairOrder,
  getAllRepairOrders,
  getRepairOrderById,
  updateRepairOrder,
} = require("../controllers/repairOrderController");

router.post("/", createRepairOrder);
router.get("/", getAllRepairOrders);
router.get("/:id", getRepairOrderById);
router.put("/:id", updateRepairOrder);

module.exports = router;
