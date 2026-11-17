const express = require("express");

const {
  createServiceBay,
  getAllServiceBays,
  getServiceBaysByDealership,
} = require("../controllers/serviceBayController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("Manager"),
  createServiceBay
);

router.get(
  "/",
  protect,
  authorize("Manager", "Service Advisor", "Technician"),
  getAllServiceBays
);

router.get(
  "/dealership/:dealershipId",
  protect,
  authorize("Manager", "Service Advisor", "Technician"),
  getServiceBaysByDealership
);

module.exports = router;