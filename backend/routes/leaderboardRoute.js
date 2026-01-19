const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const leaderboardController = require("../controllers/leaderboardController");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Users search endpoint
router.get("/:game_id", leaderboardController.getTopGamersByGameId);

router.get("/:game_id/friends", leaderboardController.getTopRankingOfFriendById);

module.exports = router;
