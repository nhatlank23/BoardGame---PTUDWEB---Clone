const express = require("express");
const router = express.Router();
const multer = require("multer");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Tìm kiếm người dùng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get("/search", userController.searchUsers);

/**
 * @openapi
 * /api/users/friends:
 *   get:
 *     tags: [Users - Friends]
 *     summary: Lấy danh sách bạn bè
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bạn bè
 */
router.get("/friends", userController.getFriends);

/**
 * @openapi
 * /api/users/friends/requests:
 *   get:
 *     tags: [Users - Friends]
 *     summary: Lấy danh sách lời mời kết bạn đã nhận
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lời mời kết bạn
 */
router.get("/friends/requests", userController.getFriendRequests);

/**
 * @openapi
 * /api/users/friends/sent:
 *   get:
 *     tags: [Users - Friends]
 *     summary: Lấy danh sách lời mời kết bạn đã gửi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lời mời đã gửi
 */
router.get("/friends/sent", userController.getSentFriendRequests);

/**
 * @openapi
 * /api/users/friends/request:
 *   post:
 *     tags: [Users - Friends]
 *     summary: Gửi lời mời kết bạn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver_id
 *             properties:
 *               receiver_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Gửi lời mời thành công
 */
router.post("/friends/request", userController.sendFriendRequest);

/**
 * @openapi
 * /api/users/friends/respond:
 *   patch:
 *     tags: [Users - Friends]
 *     summary: Phản hồi lời mời kết bạn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *               - action
 *             properties:
 *               request_id:
 *                 type: integer
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 */
router.patch("/friends/respond", userController.respondToFriendRequest);

/**
 * @openapi
 * /api/users/friends/{id}:
 *   delete:
 *     tags: [Users - Friends]
 *     summary: Xóa bạn bè hoặc hủy lời mời
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bạn bè hoặc lời mời
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/friends/:id", userController.deleteFriend);

/**
 * @openapi
 * /api/users/messages/{receiver_id}:
 *   get:
 *     tags: [Users - Messages]
 *     summary: Lấy tin nhắn với người dùng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receiver_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn
 */
router.get("/messages/:receiver_id", userController.getMessages);

/**
 * @openapi
 * /api/users/messages:
 *   post:
 *     tags: [Users - Messages]
 *     summary: Gửi tin nhắn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver_id
 *               - content
 *             properties:
 *               receiver_id:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gửi tin nhắn thành công
 */
router.post("/messages", userController.sendMessage);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get("/me", userController.getUser);
router.put("/me", userController.updateUserInfo);

/**
 * @openapi
 * /api/users/settings:
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật cài đặt người dùng
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/settings", userController.updatedUserSettings);

/**
 * @openapi
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/profile", userController.updateProfile);

/**
 * @openapi
 * /api/users/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);

/**
 * @openapi
 * /api/users/stats:
 *   get:
 *     tags: [Users - Stats]
 *     summary: Lấy thống kê game của người dùng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê game
 */
router.get("/stats", userController.getUserStats);

/**
 * @openapi
 * /api/users/history:
 *   get:
 *     tags: [Users - Stats]
 *     summary: Lấy lịch sử đấu của người dùng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi (mặc định 20)
 *     responses:
 *       200:
 *         description: Lịch sử đấu
 */
router.get("/history", userController.getUserHistory);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin người dùng theo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 */

router.get("/achievements", userController.getUserAchievements);

router.get("/:id", userController.getUserById);

/**
 * @openapi
 * /api/users/{id}/profile:
 *   get:
 *     tags: [Users]
 *     summary: Lấy profile người dùng theo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile người dùng
 */
router.get("/:id/profile", userController.getUserById);

/**
 * @openapi
 * /api/users/{id}/stats:
 *   get:
 *     tags: [Users - Stats]
 *     summary: Lấy thống kê game của người dùng theo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thống kê game
 */
router.get("/:id/stats", userController.getUserStatsByUserId);

/**
 * @openapi
 * /api/users/{id}/history:
 *   get:
 *     tags: [Users - Stats]
 *     summary: Lấy lịch sử đấu của người dùng theo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi (mặc định 20)
 *     responses:
 *       200:
 *         description: Lịch sử đấu
 */
router.get("/:id/history", userController.getUserHistoryByUserId);

/**
 * @openapi
 * /api/users/{id}/achievements:
 *   get:
 *     tags: [Users - Stats]
 *     summary: Lấy thành tích của người dùng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách thành tích
 */

module.exports = router;
