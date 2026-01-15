const express = require("express");
const router = express.Router();

const AdminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all users (admin only)
router.get("/users", AdminController.getAllUsers);

// Ban a user (admin only)
router.patch("/users/:id/ban", AdminController.toggleBanUser);

module.exports = router;
