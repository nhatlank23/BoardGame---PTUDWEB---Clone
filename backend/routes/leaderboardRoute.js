const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const leaderboardController = require("../controllers/leaderboardController");

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @openapi
 * /api/leaderboard/{game_id}:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Lấy bảng xếp hạng theo game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của game
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng người chơi hiển thị
 *     responses:
 *       200:
 *         description: Bảng xếp hạng
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
 *                       user_id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       avatar_url:
 *                         type: string
 *                       score:
 *                         type: number
 *                       rank:
 *                         type: integer
 *       404:
 *         description: Game không tồn tại
 */

/**
 * @openapi
 * /api/leaderboards/my-ranks:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Lấy xếp hạng của tôi trong tất cả games
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xếp hạng trong tất cả games
 */
router.get("/my-ranks", leaderboardController.getMyRanksAllGames);

router.get("/:game_id", leaderboardController.getTopGamersByGameId);

/**
 * @openapi
 * /api/leaderboard/{game_id}/friends:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Lấy bảng xếp hạng bạn bè theo game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của game
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng người chơi hiển thị
 *     responses:
 *       200:
 *         description: Bảng xếp hạng bạn bè
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
 *                       user_id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       avatar_url:
 *                         type: string
 *                       score:
 *                         type: number
 *                       rank:
 *                         type: integer
 *       404:
 *         description: Game không tồn tại
 */
router.get("/:game_id/friends", leaderboardController.getTopRankingOfFriendById);

/**
 * @openapi
 * /api/leaderboards/{game_id}/my-rank:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Lấy xếp hạng của tôi trong 1 game cụ thể
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xếp hạng trong game
 */
router.get("/:game_id/my-rank", leaderboardController.getMyRankByGameId);

module.exports = router;
