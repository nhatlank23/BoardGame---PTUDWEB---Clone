const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Public routes - Lấy danh sách games
router.get('/games', gameController.getAllGames);
router.get('/games/:slug', gameController.getGameBySlug);

// Protected routes - Yêu cầu đăng nhập
router.post('/sessions/save', authMiddleware, gameController.saveGameSession);
router.get('/sessions/:game_id', authMiddleware, gameController.getGameSession);
router.post('/history', authMiddleware, gameController.createPlayHistory);

// Admin only routes - Cập nhật game
router.patch('/games/:game_id', authMiddleware, roleMiddleware(['admin']), gameController.updateGame);

module.exports = router;
