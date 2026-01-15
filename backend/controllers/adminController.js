const db = require("../configs/db");
const userModel = require("../models/userModel");

module.exports = {
  // GET /api/admin/users
  getAllUsers: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId && !req.user?.role === "admin") {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const users = await userModel.getAllUsers();

      return res.json({ data: users });
    } catch (err) {
      console.error("getAllUsers error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },

  // PATCH /api/admin/users/:id/ban
  toggleBanUser: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId && !req.user?.role === "admin") {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const userId = req.params.id;

      const isBanned = req.body.is_banned;

      if (typeof isBanned !== "boolean") {
        return res.status(400).json({ status: "error", message: "is_banned must be a boolean" });
      }

      await userModel.toggleBan(userId, isBanned);

      return res.json({ data: { userId, isBanned } });
    } catch (err) {
      console.error("getAllUsers error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },
};
