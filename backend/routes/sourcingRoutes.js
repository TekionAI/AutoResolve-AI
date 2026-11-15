const express = require("express");
const router = express.Router();

const {
  getSourcingOptions,
} = require("../controllers/sourcingController");

router.get("/:repairOrderId", getSourcingOptions);

module.exports = router;