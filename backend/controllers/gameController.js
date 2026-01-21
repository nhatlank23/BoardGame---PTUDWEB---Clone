const gameModel = require('../models/gameModel');

/**
 * GET /api/games
 * Lấy danh sách các game đang active
 */
exports.getAllGames = async (req, res) => {
  try {
    const games = await gameModel.getActiveGames();
    res.status(200).json({
      status: 'success',
      data: games
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy danh sách game'
    });
  }
};

/**
 * GET /api/games/all
 * Lấy tất cả games (bao gồm cả is_active = false) - cho admin
 */
exports.getAllGamesForAdmin = async (req, res) => {
  try {
    const games = await gameModel.getAllGames();
    res.status(200).json({
      status: 'success',
      data: games
    });
  } catch (error) {
    console.error('Error fetching all games:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy danh sách game'
    });
  }
};

/**
 * GET /api/games/:slug
 * Lấy chi tiết và config của một game cụ thể
 */
exports.getGameBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const game = await gameModel.getGameBySlug(slug);

    if (!game) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy game'
      });
    }

    res.status(200).json({
      status: 'success',
      data: game
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy thông tin game'
    });
  }
};

/**
 * POST /api/sessions/save
 * Lưu trạng thái chơi dở (matrix_state, current_score)
 */
exports.saveGameSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game_id, matrix_state, current_score, elapsed_time } = req.body;

    if (!game_id || !matrix_state) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin game_id hoặc matrix_state'
      });
    }

    const game = await gameModel.getGameById(game_id);
    if (!game) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy game'
      });
    }

    const session = await gameModel.saveOrUpdateGameSession(
      userId,
      game_id,
      matrix_state,
      current_score || 0,
      elapsed_time || 0
    );

    res.status(200).json({
      status: 'success',
      message: 'Đã lưu trạng thái game',
      data: session
    });
  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lưu trạng thái game'
    });
  }
};

/**
 * GET /api/sessions/:game_id
 * Load lại trạng thái chơi gần nhất của user tại game đó
 */
exports.getGameSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game_id } = req.params;

    const session = await gameModel.getLatestGameSession(userId, game_id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy session'
      });
    }

    res.status(200).json({
      status: 'success',
      data: session
    });
  } catch (error) {
    console.error('Error fetching game session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy trạng thái game'
    });
  }
};

/**
 * PATCH /api/games/:game_id
 * Cập nhật game (admin only)
 */
exports.updateGame = async (req, res) => {
  try {
    const { game_id } = req.params;
    const { name, slug, is_active, config } = req.body;

    const game = await gameModel.getGameById(game_id);
    if (!game) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy game'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (config !== undefined) updateData.config = config;

    const updatedGame = await gameModel.updateGame(game_id, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Đã cập nhật game',
      data: updatedGame
    });
  } catch (error) {
    console.error('Error updating game:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        status: 'error',
        message: 'Slug đã tồn tại'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Không thể cập nhật game'
    });
  }
};

/**
 * POST /api/history
 * Ghi lại kết quả sau khi kết thúc một lượt chơi
 */
exports.createPlayHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game_id, score, duration, gameData } = req.body;

    if (!game_id || score === undefined || !duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin game_id, score hoặc duration'
      });
    }

    const game = await gameModel.getGameById(game_id);
    if (!game) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy game'
      });
    }

    const result = await gameModel.createPlayHistoryAndUpdateLeaderboard(
      userId,
      game_id,
      score,
      duration,
      gameData || {}
    );

    res.status(201).json({
      status: 'success',
      message: 'Đã lưu lịch sử chơi',
      data: {
        history: result.history,
        achievements: result.achievements || []
      }
    });
  } catch (error) {
    console.error('Error creating play history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lưu lịch sử chơi'
    });
  }
};