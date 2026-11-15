
const express = require("express");

const router = express.Router();

const {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  deletePart,
} = require("../controllers/partsController");

router.post("/", createPart);
router.get("/", getAllParts);
router.get("/:id", getPartById);
router.put("/:id", updatePart);
router.delete("/:id", deletePart);

module.exports = router;
