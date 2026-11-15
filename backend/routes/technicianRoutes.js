const express = require("express");

const {
  createTechnician,
  getAllTechnicians,
  getTechniciansByDealership,
} = require("../controllers/technicianController");

const router = express.Router();

router.post("/", createTechnician);
router.get("/", getAllTechnicians);
router.get("/dealership/:dealershipId", getTechniciansByDealership);

module.exports = router;