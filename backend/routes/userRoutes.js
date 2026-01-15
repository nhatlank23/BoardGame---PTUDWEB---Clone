const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Users search endpoint
router.get("/search", userController.searchUsers);

// Friends endpoint
router.get("/friends", userController.getFriends);

// Friend requests endpoint
router.get("/friends/requests", userController.getFriendRequests);

// Send friend request endpoint
router.post("/friends/request", userController.sendFriendRequest);

// Respond to friend request endpoint
router.patch("/friends/respond", userController.respondToFriendRequest);

// Delete friend or cancel request endpoint
router.delete("/friends/:id", userController.deleteFriend);

// Get messages endpoint
router.get("/messages/:receiver_id", userController.getMessages);
// Send message endpoint
router.post("/messages", userController.sendMessage);

// Get user
router.get("/me", userController.getUser);

// Update user information
router.put("/me", userController.updateUserInfo);

// Update user settings
router.put("/settings", userController.updatedUserSettings);

// Get user by ID
router.get("/:id", userController.getUserById);

// Get user achievements
router.get("/:id/achievements", userController.getUserAchievements);

module.exports = router;
