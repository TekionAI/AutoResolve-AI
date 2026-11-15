const express = require("express");
const router = express.Router();

const {
  getSourcingOptions,
} = require("../controllers/sourcingController");
const protect = require("../middleware/authMiddleware");
router.get("/repair-order/:repairOrderId", protect, getSourcingOptions);


module.exports = router;