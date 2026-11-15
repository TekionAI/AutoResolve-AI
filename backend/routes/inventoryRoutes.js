
const express = require("express");

const router = express.Router();

const {
  createInventory,
  getAllInventory,
  getInventoryByDealership,
  updateInventory,
} = require("../controllers/inventoryController");

router.post("/", createInventory);
router.get("/", getAllInventory);
router.get("/dealership/:dealershipId", getInventoryByDealership);
router.put("/:id", updateInventory);

module.exports = router;
