const express = require("express");

const {
  generateSourcingRecommendations,
  getAllRecommendations,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/", getAllRecommendations);

router.post(
  "/generate/:repairOrderId",
  generateSourcingRecommendations
);

module.exports = router;