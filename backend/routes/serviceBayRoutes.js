
const express = require("express");

const {
  createServiceBay,
  getAllServiceBays,
  getServiceBaysByDealership,
} = require("../controllers/serviceBayController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorize("Manager"), createServiceBay);
router.get("/", protect, getAllServiceBays);
router.get("/dealership/:dealershipId", protect, getServiceBaysByDealership);

module.exports = router;
