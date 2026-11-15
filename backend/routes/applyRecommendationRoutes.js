const express = require("express");

const {
  applyRecommendation,
} = require("../controllers/applyRecommendationController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.put(
  "/:recommendationId/apply",
  protect,
  authorize("Manager"),
  applyRecommendation
);

module.exports = router;