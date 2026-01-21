const express = require("express");
const router = express.Router();
const AchievementModel = require("../models/achievementModel");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @openapi
 * tags:
 *   name: Achievements
 *   description: Quản lý danh hiệu và thành tích người dùng
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Achievement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của danh hiệu
 *         name:
 *           type: string
 *           description: Tên danh hiệu
 *         description:
 *           type: string
 *           description: Mô tả cách đạt được
 *         icon_url:
 *           type: string
 *           description: URL icon của danh hiệu
 *         earned_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian đạt được (có thể null nếu chưa đạt)
 */

/**
 * @openapi
 * /api/achievements/all:
 *   get:
 *     tags: [Achievements]
 *     summary: Lấy danh sách tất cả danh hiệu trong hệ thống
 *     description: Trả về danh sách đầy đủ các danh hiệu có sẵn để người dùng tham khảo.
 *     responses:
 *       200:
 *         description: Danh sách thành công
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon_url:
 *                         type: string
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
router.get("/all", async (req, res) => {
    try {
        const achievements = await AchievementModel.getAllAchievements();
        res.json({
            status: "success",
            data: achievements,
        });
    } catch (error) {
        console.error("Get all achievements error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

/**
 * @openapi
 * /api/achievements/my:
 *   get:
 *     tags: [Achievements]
 *     summary: Lấy danh sách thành tích của người dùng hiện tại
 *     description: Trả về danh sách các thành tích mà người dùng đang đăng nhập đã đạt được.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thành tích của tôi
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
 *                     $ref: '#/components/schemas/Achievement'
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const achievements = await AchievementModel.getUserAchievements(userId);
        res.json({
            status: "success",
            data: achievements,
        });
    } catch (error) {
        console.error("Get my achievements error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

/**
 * @openapi
 * /api/achievements/user/{userId}:
 *   get:
 *     tags: [Achievements]
 *     summary: Lấy danh sách thành tích của một người dùng cụ thể
 *     description: Xem thành tích của người chơi khác thông qua User ID.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần xem
 *     responses:
 *       200:
 *         description: Danh sách thành tích người dùng
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
 *                     $ref: '#/components/schemas/Achievement'
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const achievements = await AchievementModel.getUserAchievements(userId);
        res.json({
            status: "success",
            data: achievements,
        });
    } catch (error) {
        console.error("Get user achievements error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

module.exports = router;
