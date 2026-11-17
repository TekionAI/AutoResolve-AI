const express = require("express");
const router = express.Router();

const {
  getSourcingOptions,
} = require("../controllers/sourcingController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get(
  "/repair-order/:repairOrderId",
  protect,
  authorize("Manager", "Service Advisor"),
  getSourcingOptions
);

module.exports = router;