const db = require("../configs/db");
const achievementModel = require("../models/achievementModel");
const leaderboardsModel = require("../models/leaderboardsModel");
const userModel = require("../models/userModel");

module.exports = {
  // GET /api/leaderboards/:game_id
  getTopGamersByGameId: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const gameId = req.params.game_id;
      if (!gameId) {
        return res.status(400).json({ status: "error", message: "Game ID is required" });
      }

      const leaderboards = await leaderboardsModel.getTopGamersByGameId(gameId);

      return res.json({ data: leaderboards });
    } catch (err) {
      console.error("getTopGamersByGameId error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },
};
