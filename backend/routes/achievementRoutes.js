const express = require("express");
const router = express.Router();
const AchievementModel = require("../models/achievementModel");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/achievements/all:
 *   get:
 *     tags: [Achievements]
 *     summary: Get all achievements in the system
 *     responses:
 *       200:
 *         description: Success
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
 * @swagger
 * /api/achievements/my:
 *   get:
 *     tags: [Achievements]
 *     summary: Get current user's achievements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 * @swagger
 * /api/achievements/user/{userId}:
 *   get:
 *     tags: [Achievements]
 *     summary: Get specific user's achievements
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
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
