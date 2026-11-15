const express = require("express");

const {
  generateSourcingRecommendations,
  getAllRecommendations,
} = require("../controllers/recommendationController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const router = express.Router();


router.get("/", protect, getAllRecommendations);

router.post(
  "/generate/:repairOrderId",
  protect,
  authorize("Manager", "Service Advisor"),
  generateSourcingRecommendations
);
module.exports = router;