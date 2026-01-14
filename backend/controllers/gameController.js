const db = require('../configs/db');

/**
 * GET /api/games
 * Lấy danh sách các game đang active
 */
exports.getAllGames = async (req, res) => {
  try {
    const games = await db('games')
      .where('is_active', true)
      .select('id', 'slug', 'name', 'config', 'created_at', 'updated_at');

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
 * GET /api/games/:slug
 * Lấy chi tiết và config của một game cụ thể
 */
exports.getGameBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const game = await db('games')
      .where('slug', slug)
      .first();

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

    const game = await db('games').where('id', game_id).first();
    if (!game) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy game'
      });
    }

    // Kiểm tra session đã tồn tại chưa
    const existingSession = await db('game_sessions')
      .where({
        user_id: userId,
        game_id: game_id
      })
      .first();

    let session;
    if (existingSession) {
      await db('game_sessions')
        .where('id', existingSession.id)
        .update({
          matrix_state: JSON.stringify(matrix_state),
          current_score: current_score || 0,
          elapsed_time: elapsed_time || 0,
          updated_at: db.fn.now()
        });

      session = await db('game_sessions').where('id', existingSession.id).first();
    } else {
      const [newSession] = await db('game_sessions')
        .insert({
          user_id: userId,
          game_id: game_id,
          matrix_state: JSON.stringify(matrix_state),
          current_score: current_score || 0,
          elapsed_time: elapsed_time || 0
        })
        .returning('*');

      session = newSession;
    }

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

    const session = await db('game_sessions')
      .where({
        user_id: userId,
        game_id: game_id
      })
      .orderBy('updated_at', 'desc')
      .first();

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

    // Kiểm tra game có tồn tại
    const game = await db('games').where('id', game_id).first();
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
    if (config !== undefined) updateData.config = JSON.stringify(config);
    updateData.updated_at = db.fn.now();

    await db('games')
      .where('id', game_id)
      .update(updateData);

    const updatedGame = await db('games').where('id', game_id).first();

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
    const { game_id, score, duration } = req.body;

    // Validate input
    if (!game_id || score === undefined || !duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin game_id, score hoặc duration'
      });
    }

    const game = await db('games').where('id', game_id).first();
    if (!game) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy game'
      });
    }


    const [history] = await db('play_history')
      .insert({
        user_id: userId,
        game_id: game_id,
        score: score,
        duration: duration
      })
      .returning('*');

    const leaderboard = await db('leaderboards')
      .where({
        user_id: userId,
        game_id: game_id
      })
      .first();

    if (!leaderboard || score > leaderboard.high_score) {
      if (leaderboard) {
        await db('leaderboards')
          .where('id', leaderboard.id)
          .update({
            high_score: score,
            achieved_at: db.fn.now()
          });
      } else {
        await db('leaderboards').insert({
          user_id: userId,
          game_id: game_id,
          high_score: score
        });
      }
    }
    await db('game_sessions')
      .where({
        user_id: userId,
        game_id: game_id
      })
      .delete();

    res.status(201).json({
      status: 'success',
      message: 'Đã lưu lịch sử chơi',
      data: history
    });
  } catch (error) {
    console.error('Error creating play history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lưu lịch sử chơi'
    });
  }
};
