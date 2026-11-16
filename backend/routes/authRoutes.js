
const express = require("express");

const {
  register,
  login,
  getUsers,
  createManagedUser,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Public authentication
router.post("/register", register);
router.post("/login", login);

// Manager-only user management
router.get("/users", protect, authorize("Manager"), getUsers);
router.post("/users", protect, authorize("Manager"), createManagedUser);

module.exports = router;
