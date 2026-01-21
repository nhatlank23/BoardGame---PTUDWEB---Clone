const express = require("express");
const router = express.Router();

const AdminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

const roleMiddleware = require("../middlewares/roleMiddleware");

// Apply auth middleware and role check to all routes
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

/**
 * @openapi
 * components:
 *   schemas:
 *     AdminStatsSummary:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           description: Tổng số người dùng
 *         onlineUsers:
 *           type: integer
 *           description: Số người dùng đang online
 *         newUsers:
 *           type: integer
 *           description: Số người dùng mới trong 7 ngày qua
 *         totalGames:
 *           type: integer
 *           description: Tổng số game trong hệ thống
 *     GamePlayStats:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         plays:
 *           type: integer
 *           description: Số lượt chơi trong 7 ngày qua
 *     HourlyActivity:
 *       type: object
 *       properties:
 *         hour:
 *           type: integer
 *           description: Giờ trong ngày (0-23)
 *         count:
 *           type: integer
 *           description: Số lượng hoạt động
 */

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách tất cả người dùng (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Không có quyền truy cập
 */
router.get("/users", AdminController.getAllUsers);

/**
 * @openapi
 * /api/admin/users/{id}/ban:
 *   patch:
 *     tags: [Admin]
 *     summary: Ban/Unban người dùng (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_banned
 *             properties:
 *               is_banned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     isBanned:
 *                       type: boolean
 *       403:
 *         description: Không có quyền truy cập
 */
router.patch("/users/:id/ban", AdminController.toggleBanUser);

/**
 * @openapi
 * /api/admin/stats/summary:
 *   get:
 *     tags: [Admin - Stats]
 *     summary: Tổng hợp stats dashboard (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats tổng quan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AdminStatsSummary'
 */
router.get("/stats/summary", AdminController.getStatsSummary);

/**
 * @openapi
 * /api/admin/stats/games-played:
 *   get:
 *     tags: [Admin - Stats]
 *     summary: Thống kê số lượng game đã chơi (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê game
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GamePlayStats'
 */
router.get("/stats/games-played", AdminController.getGamesPlayed);

/**
 * @openapi
 * /api/admin/stats/hourly-activity:
 *   get:
 *     tags: [Admin - Stats]
 *     summary: Thống kê hoạt động theo giờ (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: game_id
 *         schema:
 *           type: integer
 *         description: Lọc theo game ID (tùy chọn)
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Số ngày gần nhất (mặc định 7)
 *     responses:
 *       200:
 *         description: Thống kê hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HourlyActivity'
 */
router.get("/stats/hourly-activity", AdminController.getHourlyActivity);

module.exports = router;
