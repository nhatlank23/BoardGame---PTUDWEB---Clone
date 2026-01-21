const db = require("../configs/db");
const achievementModel = require("../models/achievementModel");
const userModel = require("../models/userModel");

module.exports = {
  // GET /api/users/search?q=...
  searchUsers: async (req, res) => {
    try {
      const q = req.query.q;
      if (!q || String(q).trim().length < 2) {
        return res.json({ data: [] });
      }

      const term = `%${String(q).trim()}%`;
      const currentUserId = req.user?.id || req.userId;

      let query = db("users")
        .where(function () {
          this.where("username", "ilike", term).orWhere("email", "ilike", term);
        })
        .select("id", "username", "email", "avatar_url", "created_at", "role", "status")
        .limit(10);

      if (currentUserId) {
        // Exclude the requesting user's own account from results
        query = query.whereNot("id", currentUserId);
      }

      const rows = await query;

      const users = rows.map((r) => ({
        id: r.id,
        username: r.username,
        email: r.email,
        avatar: r.avatar_url || null,
        created_at: r.created_at,
        role: r.role,
        status: r.status,
      }));

      return res.json({ data: users });
    } catch (err) {
      console.error("searchUsers error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/friends
  getFriends: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const PAGE_SIZE = 50;

      const page = req.query?.page ? Number(req.query?.page) : 1;
      const pageSize = req.query?.pageSize
        ? Number(req.query?.pageSize)
        : PAGE_SIZE;

      // Count total friends
      const [countAsRequester] = await db("friendships")
        .where("friendships.requester_id", userId)
        .andWhere("friendships.status", "accepted")
        .count("* as count");

      const [countAsAddressee] = await db("friendships")
        .where("friendships.addressee_id", userId)
        .andWhere("friendships.status", "accepted")
        .count("* as count");

      const totalCount = parseInt(countAsRequester.count) + parseInt(countAsAddressee.count);
      const totalPages = Math.ceil(totalCount / pageSize);

      const friendsAsRequester = await db("friendships")
        .where("friendships.requester_id", userId)
        .andWhere("friendships.status", "accepted")
        .join("users", "users.id", "friendships.addressee_id")
        .select("users.id", "users.username", "users.email", "users.avatar_url")
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const friendsAsAddressee = await db("friendships")
        .where("friendships.addressee_id", userId)
        .andWhere("friendships.status", "accepted")
        .join("users", "users.id", "friendships.requester_id")
        .select("users.id", "users.username", "users.email", "users.avatar_url")
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const allFriends = [...friendsAsRequester, ...friendsAsAddressee];

      const friends = allFriends.map((r) => ({
        id: r.id,
        name: r.username,
        email: r.email,
        avatar: r.avatar_url || null,
        status: r.status || "Offline",
      }));

      return res.json({
        data: friends,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages
        }
      });
    } catch (err) {
      console.error("getFriends error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/friends/requests
  getFriendRequests: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const PAGE_SIZE = 50;

      const page = req.query?.page ? Number(req.query?.page) : 1;
      const pageSize = req.query?.pageSize
        ? Number(req.query?.pageSize)
        : PAGE_SIZE;

      // Count total pending requests
      const [{ count: totalCount }] = await db("friendships")
        .where("friendships.addressee_id", userId)
        .andWhere("friendships.status", "pending")
        .count("* as count");

      const totalPages = Math.ceil(parseInt(totalCount) / pageSize);

      const rows = await db("friendships")
        .where("friendships.addressee_id", userId)
        .andWhere("friendships.status", "pending")
        .join("users", "users.id", "friendships.requester_id")
        .select("users.id", "users.username", "users.email", "users.avatar_url")
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const requests = rows.map((r) => ({
        id: r.id,
        name: r.username,
        email: r.email,
        avatar: r.avatar_url || null,
      }));

      return res.json({
        data: requests,
        pagination: {
          page,
          pageSize,
          totalCount: parseInt(totalCount),
          totalPages
        }
      });
    } catch (err) {
      console.error("getFriendRequests error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/friends/sent - Get sent friend requests (outgoing pending)
  getSentFriendRequests: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const rows = await db("friendships")
        .where("friendships.requester_id", userId)
        .andWhere("friendships.status", "pending")
        .join("users", "users.id", "friendships.addressee_id")
        .select("users.id", "users.username", "users.email", "users.avatar_url")
        .limit(50);

      const sentRequests = rows.map((r) => ({
        id: r.id,
        name: r.username,
        email: r.email,
        avatar: r.avatar_url || null,
      }));

      return res.json({ data: sentRequests });
    } catch (err) {
      console.error("getSentFriendRequests error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // POST /api/friends/request
  sendFriendRequest: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const { addresseeId } = req.body;
      if (!addresseeId) {
        return res
          .status(400)
          .json({ status: "error", message: "addresseeId is required" });
      }

      if (userId === addresseeId) {
        return res.status(400).json({
          status: "error",
          message: "Cannot send friend request to yourself",
        });
      }

      const existing = await db("friendships")
        .where(function () {
          this.where({
            requester_id: userId,
            addressee_id: addresseeId,
          }).orWhere({ requester_id: addresseeId, addressee_id: userId });
        })
        .first();

      if (existing) {
        if (existing.status === "accepted") {
          return res
            .status(400)
            .json({ status: "error", message: "Already friends" });
        }
        if (existing.status === "pending") {
          return res.status(400).json({
            status: "error",
            message: "Friend request already exists",
          });
        }
      }

      const [newRequest] = await db("friendships")
        .insert({
          requester_id: userId,
          addressee_id: addresseeId,
          status: "pending",
        })
        .returning("*");

      return res.json({ success: true, data: newRequest });
    } catch (err) {
      console.error("sendFriendRequest error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // DELETE /api/friends/:id
  deleteFriend: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const friendId = req.params.id;
      if (!friendId) {
        return res
          .status(400)
          .json({ status: "error", message: "Friend id is required" });
      }

      const deleted = await db("friendships")
        .where(function () {
          this.where({ requester_id: userId, addressee_id: friendId }).orWhere({
            requester_id: friendId,
            addressee_id: userId,
          });
        })
        .del();

      if (deleted === 0) {
        return res
          .status(404)
          .json({ status: "error", message: "Friendship not found" });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("deleteFriend error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // PATCH /api/friends/respond
  respondToFriendRequest: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const { requesterId, action } = req.body;
      if (!requesterId || !action) {
        return res.status(400).json({
          status: "error",
          message: "requesterId and action are required",
        });
      }

      if (!["accept", "decline"].includes(action)) {
        return res.status(400).json({
          status: "error",
          message: "action must be accept or decline",
        });
      }

      const friendship = await db("friendships")
        .where({
          requester_id: requesterId,
          addressee_id: userId,
          status: "pending",
        })
        .first();

      if (!friendship) {
        return res
          .status(404)
          .json({ status: "error", message: "Friend request not found" });
      }

      if (action === "accept") {
        // Chấp nhận: cập nhật status thành accepted
        await db("friendships")
          .where({ id: friendship.id })
          .update({ status: "accepted", updated_at: db.fn.now() });
      } else {
        // Từ chối: xóa hẳn request (không lưu declined)
        await db("friendships").where({ id: friendship.id }).del();
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("respondToFriendRequest error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/messages/:receiver_id
  // Query params: ?before=<message_id>&limit=<number>
  getMessages: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const receiverId = req.params.receiver_id;
      if (!receiverId) return res.status(400).json({ status: "error", message: "receiver_id is required" });

      const limit = parseInt(req.query.limit) || 30;

      // SỬA: Không dùng parseInt cho 'before' vì nó là chuỗi thời gian (ISO String)
      const before = req.query.before || null;

      // 1. Lấy tin nhắn
      let query = db("messages")
        .where(function () {
          this.where({ sender_id: userId, receiver_id: receiverId })
            .orWhere({ sender_id: receiverId, receiver_id: userId });
        })
        .select("id", "sender_id", "receiver_id", "content", "created_at")
        .orderBy("created_at", "desc") // Sắp xếp theo thời gian mới nhất
        .limit(limit);

      if (before) {
        query = query.where("created_at", "<", before); // So sánh thời gian với thời gian
      }

      const messagesDesc = await query;
      const oldestMsg = messagesDesc.length > 0 ? messagesDesc[messagesDesc.length - 1] : null;

      // nextCursor bây giờ là chuỗi thời gian
      const nextCursor = oldestMsg ? oldestMsg.created_at : null;
      const sortedMessages = [...messagesDesc].reverse();

      // 2. Logic check hasMore (SỬA LỖI UUID TẠI ĐÂY)
      let hasMore = false;
      if (messagesDesc.length === limit && nextCursor) {
        const [{ count: olderCount }] = await db("messages")
          .where(function () {
            this.where({ sender_id: userId, receiver_id: receiverId })
              .orWhere({ sender_id: receiverId, receiver_id: userId });
          })
          .where("created_at", "<", nextCursor) // SỬA: So sánh created_at với nextCursor
          .count("* as count");

        hasMore = parseInt(olderCount) > 0;
      }

      // 3. Tính tổng tin nhắn (Để hiện số lượng nếu cần)
      const [{ count: totalCount }] = await db("messages")
        .where(function () {
          this.where({ sender_id: userId, receiver_id: receiverId })
            .orWhere({ sender_id: receiverId, receiver_id: userId });
        })
        .count("* as count");

      return res.json({
        data: sortedMessages,
        pagination: {
          totalCount: parseInt(totalCount),
          hasMore,
          nextCursor: hasMore ? nextCursor : null
        }
      });

    } catch (err) {
      console.error("getMessages error:", err);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  },

  // POST /api/messages
  sendMessage: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const { receiver_id, content } = req.body;
      if (!receiver_id) {
        return res
          .status(400)
          .json({ status: "error", message: "receiver_id is required" });
      }
      if (!content || String(content).trim().length === 0) {
        return res
          .status(400)
          .json({ status: "error", message: "content is required" });
      }

      const [message] = await db("messages")
        .insert({ sender_id: userId, receiver_id, content })
        .returning(["id", "sender_id", "receiver_id", "content", "created_at"]);

      return res.json({ success: true, data: message });
    } catch (err) {
      console.error("sendMessage error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/users/me
  getUser: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const user = await userModel.findById(userId);

      return res.json({ data: user });
    } catch (err) {
      console.error("getUser error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // PUT /api/users/me
  updateUserInfo: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const { avatar_url, username } = req.body;

      const updatedUser = await userModel.updateUser(userId, {
        avatar_url,
        username,
      });

      return res.json({ data: updatedUser[0] });
    } catch (err) {
      console.error("updateUser error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // PUT /api/users/settings
  updatedUserSettings: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const { dark_mode } = req.body;

      // Kiểm tra giá trị đầu vào
      if (typeof dark_mode !== "boolean") {
        return res
          .status(400)
          .json({ status: "error", message: "dark_mode must be a boolean" });
      }
      if (dark_mode !== true && dark_mode !== false) {
        return res
          .status(400)
          .json({ status: "error", message: "Require dark_mode" });
      }

      const updatedUserSettings = await userModel.updateUser(userId, {
        dark_mode,
      });

      return res.json({ data: updatedUserSettings[0] });
    } catch (err) {
      console.error("updateUserSettings error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/users/:id
  getUserById: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const userId = req?.params?.id;
      if (!userId) {
        return res
          .status(400)
          .json({ status: "error", message: "User id is required" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
      }

      return res.json({ data: user });
    } catch (err) {
      console.error("getUser error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/users/:id/achievements
  getUserAchievements: async (req, res) => {
    try {
      const requesterId = req.user?.id || req.userId;
      if (!requesterId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const userId = req?.params?.id;
      if (!userId) {
        return res
          .status(400)
          .json({ status: "error", message: "User id is required" });
      }

      const achievements = await achievementModel.getUserAchievements(userId);

      return res.json({ data: achievements });
    } catch (err) {
      console.error("getUserAchievements error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/users/stats - Lấy thống kê game của user hiện tại
  getUserStats: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      // Lấy thống kê từ play_history
      const stats = await db("play_history")
        .where("play_history.user_id", userId)
        .join("games", "games.id", "play_history.game_id")
        .select(
          "games.name as game_name",
          db.raw("COUNT(*) as played"),
          db.raw("MAX(play_history.score) as record"),
          db.raw("AVG(play_history.score)::INTEGER as avg_score"),
          db.raw(
            "SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"
          ),
          db.raw(
            "ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"
          )
        )
        .groupBy("games.id", "games.name");

      return res.json({ data: stats });
    } catch (err) {
      console.error("getUserStats error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // GET /api/users/history - Lấy lịch sử đấu gần đây
  getUserHistory: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const limit = parseInt(req.query.limit) || 20;

      const history = await db("play_history")
        .where("play_history.user_id", userId)
        .join("games", "games.id", "play_history.game_id")
        .select(
          "play_history.id",
          "games.name as game_name",
          "play_history.score",
          "play_history.duration",
          "play_history.played_at"
        )
        .orderBy("play_history.played_at", "desc")
        .limit(limit);

      return res.json({ data: history });
    } catch (err) {
      console.error("getUserHistory error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // PUT /api/users/profile - Cập nhật profile (username, avatar_url)
  updateProfile: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }

      const { username, avatar_url } = req.body;

      // Validate input
      if (!username && !avatar_url) {
        return res.status(400).json({
          status: "error",
          message: "Username hoặc avatar_url là bắt buộc",
        });
      }

      const updateData = {};

      // Kiểm tra username mới nếu có
      if (username) {
        if (username.length < 3) {
          return res.status(400).json({
            status: "error",
            message: "Username phải có ít nhất 3 ký tự",
          });
        }

        // Kiểm tra username đã tồn tại chưa
        const existingUser = await db("users")
          .where("username", username)
          .whereNot("id", userId)
          .first();

        if (existingUser) {
          return res.status(409).json({
            status: "error",
            message: "Username đã được sử dụng",
          });
        }

        updateData.username = username;
      }

      if (avatar_url) {
        updateData.avatar_url = avatar_url;
      }

      // Cập nhật user
      const [updatedUser] = await db("users")
        .where("id", userId)
        .update({
          ...updateData,
          updated_at: db.fn.now(),
        })
        .returning([
          "id",
          "username",
          "email",
          "avatar_url",
          "role",
          "dark_mode",
        ]);

      return res.json({
        status: "success",
        message: "Cập nhật profile thành công",
        data: updatedUser,
      });
    } catch (err) {
      console.error("updateProfile error:", err);
      return res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  },

  // POST /api/users/avatar - Upload avatar
  uploadAvatar: async (req, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "No file uploaded",
        });
      }

      const { supabase } = require("../configs/supabase");
      const { v4: uuidv4 } = require("uuid");
      const path = require("path");

      if (!supabase) {
        return res.status(503).json({
          status: "error",
          message: "Storage service not configured",
        });
      }

      // Get current user to delete old avatar
      const user = await db("users").where("id", userId).first();

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${userId}/${uuidv4()}${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatar")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return res.status(500).json({
          status: "error",
          message: `Upload failed: ${error.message}`,
        });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatar")
        .getPublicUrl(data.path);

      const avatarUrl = publicUrlData.publicUrl;

      // Update user avatar_url
      const [updatedUser] = await db("users")
        .where("id", userId)
        .update({
          avatar_url: avatarUrl,
          updated_at: db.fn.now(),
        })
        .returning([
          "id",
          "username",
          "email",
          "avatar_url",
          "role",
          "dark_mode",
        ]);

      // Delete old avatar if exists
      if (user.avatar_url && user.avatar_url.includes("supabase.co")) {
        try {
          const oldPath = user.avatar_url.split("/avatar/")[1];
          if (oldPath) {
            await supabase.storage.from("avatar").remove([oldPath]);
          }
        } catch (deleteError) {
          console.error("Error deleting old avatar:", deleteError);
          // Continue anyway
        }
      }

      return res.json({
        status: "success",
        message: "Upload avatar thành công",
        data: {
          avatar_url: avatarUrl,
          user: updatedUser,
        },
      });
    } catch (err) {
      console.error("uploadAvatar error:", err);
      return res.status(500).json({
        status: "error",
        message: err.message || "Internal Server Error",
      });
    }
  },

  // GET /api/users/:id/stats - Lấy thống kê game của user khác
  getUserStatsByUserId: async (req, res) => {
    try {
      const { id } = req.params;

      // Kiểm tra user có tồn tại không
      const userExists = await db("users").where("id", id).first();
      if (!userExists) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy người dùng",
        });
      }

      // Lấy thống kê từ play_history
      const stats = await db("play_history")
        .where("play_history.user_id", id)
        .join("games", "games.id", "play_history.game_id")
        .select(
          "games.name as game_name",
          db.raw("COUNT(*) as played"),
          db.raw("MAX(play_history.score) as record"),
          db.raw("AVG(play_history.score)::INTEGER as avg_score"),
          db.raw(
            "SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"
          ),
          db.raw(
            "ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"
          )
        )
        .groupBy("games.id", "games.name");

      return res.json({ data: stats });
    } catch (err) {
      console.error("getUserStatsByUserId error:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  // GET /api/users/:id/history - Lấy lịch sử đấu của user khác
  getUserHistoryByUserId: async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      // Kiểm tra user có tồn tại không
      const userExists = await db("users").where("id", id).first();
      if (!userExists) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy người dùng",
        });
      }

      const history = await db("play_history")
        .where("play_history.user_id", id)
        .join("games", "games.id", "play_history.game_id")
        .select(
          "play_history.id",
          "games.name as game_name",
          "play_history.score",
          "play_history.duration",
          "play_history.played_at"
        )
        .orderBy("play_history.played_at", "desc")
        .limit(limit);

      return res.json({ data: history });
    } catch (err) {
      console.error("getUserHistoryByUserId error:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
};
