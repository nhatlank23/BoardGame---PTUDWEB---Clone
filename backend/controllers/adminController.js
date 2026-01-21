const db = require("../configs/db");
const userModel = require("../models/userModel");

module.exports = {
  // GET /api/admin/stats/summary
  getStatsSummary: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId || req.user?.role !== "admin") {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      // Tổng số user
      const totalUsersResult = await db("users").count("* as count").first();
      const totalUsers = Number(totalUsersResult.count);

      // User online (status = 'Online')
      const onlineUsersResult = await db("users").where("status", "Online").count("* as count").first();
      const onlineUsers = Number(onlineUsersResult.count);

      // User mới (7 ngày gần nhất)
      const newUsersResult = await db("users")
        .where("created_at", ">=", db.raw("NOW() - INTERVAL '7 days'"))
        .count("* as count")
        .first();
      const newUsers = Number(newUsersResult.count);

      // Tổng số game
      const totalGamesResult = await db("games").count("* as count").first();
      const totalGames = Number(totalGamesResult.count);

      return res.json({
        data: {
          totalUsers,
          onlineUsers,
          newUsers,
          totalGames,
        },
      });
    } catch (err) {
      console.error("getStatsSummary error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/admin/users
  getAllUsers: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId && !req.user?.role === "admin") {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status || 'all';
      const search = req.query.search || '';

      // Truyền thêm điều kiện lọc vào Model
      const { users, total } = await userModel.getAllUsers({
        page,
        limit,
        status,
        search
      });

      const totalPages = Math.ceil(total / limit);

      return res.json({
        data: users,
        meta: { total, page, limit, totalPages },
      });
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

      const gamesPlayed = await db("games")
        .select("games.id", "games.name", "games.slug")
        .count("game_logs.id as plays")
        .leftJoin("game_logs", function () {
          this.on("games.id", "=", "game_logs.game_id")
            .andOn(db.raw("game_logs.played_at >= NOW() - INTERVAL '7 days'"))
        })
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

  // GET /api/admin/stats/hourly-activity?game_id=X&days=7
  getHourlyActivity: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId || req.user?.role !== "admin") {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const gameId = req.query.game_id;
      const days = parseInt(req.query.days) || 7; // Default 7 ngày

      let query = db("game_logs")
        .select(db.raw("EXTRACT(HOUR FROM played_at) as hour"))
        .count("* as count")
        .whereRaw(`played_at >= NOW() - INTERVAL '${days} days'`)
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
