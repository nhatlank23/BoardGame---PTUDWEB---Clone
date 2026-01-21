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

      const gameId = parseInt(req.params.game_id, 10);
      if (!gameId || isNaN(gameId)) {
        return res.status(400).json({ status: "error", message: "Game ID is required and must be a number" });
      }

      const page = req.query?.page ? Number(req.query?.page) : 1;
      const pageSize = req.query?.pageSize ? Number(req.query?.pageSize) : PAGE_SIZE;

      // Get total count
      const totalCount = await leaderboardsModel.countPlayersByGameId(gameId);
      const totalPages = Math.ceil(totalCount / pageSize);

      const leaderboards = await leaderboardsModel.getTopGamersByGameId(gameId, page, pageSize);

      return res.json({
        status: "success",
        data: leaderboards,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages
        }
      });
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

      const gameId = parseInt(req.params.game_id, 10);
      if (!gameId || isNaN(gameId)) {
        return res.status(400).json({ status: "error", message: "Game ID is required and must be a number" });
      }

      const page = req.query?.page ? Number(req.query?.page) : 1;
      const pageSize = req.query?.pageSize ? Number(req.query?.pageSize) : PAGE_SIZE;

      // Get total count
      const totalCount = await leaderboardsModel.countFriendsByUserId_GameId(userId, gameId);
      const totalPages = Math.ceil(totalCount / pageSize);

      const leaderboards = await leaderboardsModel.getTopRankingOfFriendByUserId_GameId(userId, gameId, page, pageSize);

      return res.json({
        status: "success",
        data: leaderboards,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages
        }
      });
    } catch (err) {
      console.error("getTopRankingOfFriendById error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/leaderboards/:game_id/my-rank - Get current user's rank in a specific game
  getMyRankByGameId: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const gameId = parseInt(req.params.game_id, 10);
      if (!gameId || isNaN(gameId)) {
        return res.status(400).json({ status: "error", message: "Game ID is required and must be a number" });
      }

      const rankInfo = await leaderboardsModel.getUserRankByGameId(userId, gameId);

      if (!rankInfo) {
        return res.json({
          status: "success",
          data: null,
          message: "Bạn chưa chơi game này"
        });
      }

      return res.json({
        status: "success",
        data: rankInfo
      });
    } catch (err) {
      console.error("getMyRankByGameId error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/leaderboards/my-ranks - Get current user's ranks in all games
  getMyRanksAllGames: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const ranks = await leaderboardsModel.getUserRanksAllGames(userId);

      return res.json({
        status: "success",
        data: ranks
      });
    } catch (err) {
      console.error("getMyRanksAllGames error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },
};
