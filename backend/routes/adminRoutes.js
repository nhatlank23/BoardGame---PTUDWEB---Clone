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
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
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
 *     responses:
 *       200:
 *         description: Thống kê hoạt động
 */
router.get("/stats/hourly-activity", AdminController.getHourlyActivity);

module.exports = router;
