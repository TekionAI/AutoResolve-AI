const express = require("express");

const {
  createServiceBay,
  getAllServiceBays,
  getServiceBaysByDealership,
} = require("../controllers/serviceBayController");

const router = express.Router();

router.post("/", createServiceBay);
router.get("/", getAllServiceBays);
router.get("/dealership/:dealershipId", getServiceBaysByDealership);

module.exports = router;