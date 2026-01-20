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

      const PAGE_SIZE = 50;

      const gameId = req.params.game_id;
      if (!gameId) {
        return res.status(400).json({ status: "error", message: "Game ID is required" });
      }

      const page = req.query?.page ? Number(req.query?.page) : 1;
      const pageSize = req.query?.pageSize ? Number(req.query?.pageSize) : PAGE_SIZE;

      const leaderboards = await leaderboardsModel.getTopGamersByGameId(gameId, page, pageSize);

      return res.json({ status: "success", data: leaderboards });
    } catch (err) {
      console.error("getTopGamersByGameId error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },

  getTopRankingOfFriendById: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const PAGE_SIZE = 50;

      const gameId = req.params.game_id;
      if (!gameId) {
        return res.status(400).json({ status: "error", message: "Game ID is required" });
      }

      const page = req.query?.page ? Number(req.query?.page) : 1;
      const pageSize = req.query?.pageSize ? Number(req.query?.pageSize) : PAGE_SIZE;

      const leaderboards = await leaderboardsModel.getTopRankingOfFriendByUserId_GameId(userId, gameId, page, pageSize);

      return res.json({ status: "success", data: leaderboards });
    } catch (err) {
      console.error("getTopRankingOfFriendById error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },
};
