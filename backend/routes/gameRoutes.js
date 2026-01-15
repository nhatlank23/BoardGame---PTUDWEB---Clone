const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/**
 * @openapi
 * tags:
 *   name: Games
 *   description: Quản lý danh sách trò chơi, phiên chơi (sessions) và lịch sử đấu
 */

/**
 * @openapi
 * /api/games:
 *   get:
 *     summary: Lấy danh sách các game đang hoạt động (Public)
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: Danh sách game active
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
 *                     $ref: '#/components/schemas/Game'
 */
router.get('/games', gameController.getAllGames);

/**
 * @openapi
 * /api/games/all:
 *   get:
 *     summary: Lấy toàn bộ danh sách game (Admin Only)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả game (bao gồm cả game đã ẩn)
 *       403:
 *         description: Không có quyền Admin
 */
router.get('/games/all', authMiddleware, roleMiddleware(['admin']), gameController.getAllGamesForAdmin);

/**
 * @openapi
 * /api/games/{slug}:
 *   get:
 *     summary: Lấy chi tiết một game cụ thể qua slug
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: "Slug của game (ví dụ: caro-5)"
 *     responses:
 *       200:
 *         description: Thông tin chi tiết game
 *       404:
 *         description: Không tìm thấy game
 */
router.get('/games/:slug', gameController.getGameBySlug);

/**
 * @openapi
 * /api/sessions/save:
 *   post:
 *     summary: Lưu trạng thái chơi dở (Cần đăng nhập)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_id
 *               - matrix_state
 *             properties:
 *               game_id:
 *                 type: integer
 *                 example: 1
 *               matrix_state:
 *                 type: object
 *                 description: Trạng thái bàn cờ/game
 *               current_score:
 *                 type: integer
 *                 example: 100
 *               elapsed_time:
 *                 type: integer
 *                 description: Thời gian đã chơi (giây)
 *     responses:
 *       200:
 *         description: Đã lưu trạng thái
 *       400:
 *         description: Thiếu thông tin bắt buộc
 */
router.post('/sessions/save', authMiddleware, gameController.saveGameSession);

/**
 * @openapi
 * /api/sessions/{game_id}:
 *   get:
 *     summary: Tải lại trạng thái chơi gần nhất của user (Cần đăng nhập)
 *     tags: [Games]
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
 *         description: Trả về session gần nhất
 *       404:
 *         description: Không tìm thấy phiên chơi nào
 */
router.get('/sessions/:game_id', authMiddleware, gameController.getGameSession);

/**
 * @openapi
 * /api/history:
 *   post:
 *     summary: Ghi lại kết quả sau khi kết thúc lượt chơi (Cần đăng nhập)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_id
 *               - score
 *               - duration
 *             properties:
 *               game_id:
 *                 type: integer
 *               score:
 *                 type: integer
 *               duration:
 *                 type: integer
 *                 description: Thời gian chơi tính bằng giây
 *     responses:
 *       201:
 *         description: Đã lưu lịch sử và cập nhật BXH thành công
 */
router.post('/history', authMiddleware, gameController.createPlayHistory);

/**
 * @openapi
 * /api/games/{game_id}:
 *   patch:
 *     summary: Cập nhật thông tin game (Admin Only)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật game thành công
 *       400:
 *         description: Lỗi trùng lặp Slug (23505)
 */
router.patch('/games/:game_id', authMiddleware, roleMiddleware(['admin']), gameController.updateGame);

module.exports = router;