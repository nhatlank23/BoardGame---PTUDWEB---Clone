const db = require("../configs/db");
const userModel = require("../models/userModel");

module.exports = {
  // GET /api/admin/users
  getAllUsers: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId && !req.user?.role === "admin") {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const users = await userModel.getAllUsers();

      return res.json({ data: users });
    } catch (err) {
      console.error("getAllUsers error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // PATCH /api/admin/users/:id/ban
  toggleBanUser: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId && !req.user?.role === "admin") {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const userId = req.params.id;

      const isBanned = req.body.is_banned;

      if (typeof isBanned !== "boolean") {
        return res
          .status(400)
          .json({ status: "error", message: "is_banned must be a boolean" });
      }

      await userModel.toggleBan(userId, isBanned);

      return res.json({ data: { userId, isBanned } });
    } catch (err) {
      console.error("getAllUsers error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/admin/stats/games-played
  getGamesPlayed: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId || req.user?.role !== "admin") {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const gamesPlayed = await db("game_logs")
        .select("games.id", "games.name", "games.slug")
        .count("game_logs.id as plays")
        .join("games", "games.id", "game_logs.game_id")
        .groupBy("games.id", "games.name", "games.slug")
        .orderBy("plays", "desc");

      return res.json({ data: gamesPlayed });
    } catch (err) {
      console.error("getGamesPlayed error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/admin/stats/hourly-activity?game_id=X
  getHourlyActivity: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId || req.user?.role !== "admin") {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const gameId = req.query.game_id;

      let query = db("game_logs")
        .select(db.raw("EXTRACT(HOUR FROM played_at) as hour"))
        .count("* as count")
        .whereRaw("DATE(played_at) = CURRENT_DATE")
        .groupBy(db.raw("EXTRACT(HOUR FROM played_at)"))
        .orderBy("hour");

      if (gameId) {
        query = query.where("game_id", gameId);
      }

      const hourlyData = await query;

      const activityByHour = Array.from({ length: 24 }, (_, hour) => {
        const found = hourlyData.find((d) => Number(d.hour) === hour);
        return {
          hour,
          count: found ? Number(found.count) : 0,
        };
      });

      return res.json({ data: activityByHour });
    } catch (err) {
      console.error("getHourlyActivity error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },
};
