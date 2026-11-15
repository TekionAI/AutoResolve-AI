
const express = require("express");

const router = express.Router();

const {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  deletePart,
} = require("../controllers/partsController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
router.post("/", protect, authorize("Manager"), createPart);
router.get("/", protect, getAllParts);
router.get("/:id", protect, getPartById);
router.put("/:id", protect, authorize("Manager"), updatePart);
router.delete("/:id", protect, authorize("Manager"), deletePart);


module.exports = router;
