const express = require("express");

const {
  reviewRecommendation,
} = require("../controllers/approvalController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.put(
  "/:recommendationId/review",
  protect,
  authorize("Manager"),
  reviewRecommendation
);

module.exports = router;