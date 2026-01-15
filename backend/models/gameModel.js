const db = require('../configs/db');

/**
 * Lấy danh sách các game đang active
 * @returns {Promise<Array>} Danh sách games
 */
async function getActiveGames() {
  return db('games')
    .where('is_active', true)
    .select('id', 'slug', 'name', 'config', 'created_at', 'updated_at');
}

/**
 * Lấy tất cả games (bao gồm cả is_active = false)
 * @returns {Promise<Array>} Danh sách tất cả games
 */
async function getAllGames() {
  return db('games')
    .select('id', 'slug', 'name', 'config', 'is_active', 'created_at', 'updated_at')
    .orderBy('created_at', 'desc');
}

/**
 * Lấy chi tiết game bằng slug
 * @param {string} slug - Slug của game
 * @returns {Promise<Object|null>} Chi tiết game hoặc null nếu không tìm thấy
 */
async function getGameBySlug(slug) {
  return db('games')
    .where('slug', slug)
    .first();
}

/**
 * Lấy game bằng ID
 * @param {number} gameId - ID của game
 * @returns {Promise<Object|null>} Chi tiết game hoặc null nếu không tìm thấy
 */
async function getGameById(gameId) {
  return db('games')
    .where('id', gameId)
    .first();
}

/**
 * Lưu hoặc cập nhật session game
 * @param {number} userId - ID của user
 * @param {number} gameId - ID của game
 * @param {Object} matrixState - Trạng thái matrix
 * @param {number} [currentScore=0] - Điểm hiện tại
 * @param {number} [elapsedTime=0] - Thời gian đã chơi
 * @returns {Promise<Object>} Session đã lưu
 */
async function saveOrUpdateGameSession(userId, gameId, matrixState, currentScore = 0, elapsedTime = 0) {
  const existingSession = await db('game_sessions')
    .where({
      user_id: userId,
      game_id: gameId
    })
    .first();

  if (existingSession) {
    await db('game_sessions')
      .where('id', existingSession.id)
      .update({
        matrix_state: JSON.stringify(matrixState),
        current_score: currentScore,
        elapsed_time: elapsedTime,
        updated_at: db.fn.now()
      });
    return db('game_sessions').where('id', existingSession.id).first();
  } else {
    const [newSession] = await db('game_sessions')
      .insert({
        user_id: userId,
        game_id: gameId,
        matrix_state: JSON.stringify(matrixState),
        current_score: currentScore,
        elapsed_time: elapsedTime
      })
      .returning('*');
    return newSession;
  }
}

/**
 * Lấy session game gần nhất của user
 * @param {number} userId - ID của user
 * @param {number} gameId - ID của game
 * @returns {Promise<Object|null>} Session hoặc null nếu không tìm thấy
 */
async function getLatestGameSession(userId, gameId) {
  return db('game_sessions')
    .where({
      user_id: userId,
      game_id: gameId
    })
    .orderBy('updated_at', 'desc')
    .first();
}

/**
 * Cập nhật game
 * @param {number} gameId - ID của game
 * @param {Object} updateData - Dữ liệu cần cập nhật (name, slug, is_active, config)
 * @returns {Promise<Object>} Game đã cập nhật
 */
async function updateGame(gameId, updateData) {
  const processedData = { ...updateData };
  if (processedData.config) {
    processedData.config = JSON.stringify(processedData.config);
  }
  processedData.updated_at = db.fn.now();

  await db('games')
    .where('id', gameId)
    .update(processedData);
  return db('games').where('id', gameId).first();
}

/**
 * Tạo lịch sử chơi, cập nhật leaderboard và xóa session
 * @param {number} userId - ID của user
 * @param {number} gameId - ID của game
 * @param {number} score - Điểm đạt được
 * @param {number} duration - Thời gian chơi
 * @returns {Promise<Object>} Lịch sử chơi đã tạo
 */
async function createPlayHistoryAndUpdateLeaderboard(userId, gameId, score, duration) {
  const [history] = await db('play_history')
    .insert({
      user_id: userId,
      game_id: gameId,
      score: score,
      duration: duration
    })
    .returning('*');

  const leaderboard = await db('leaderboards')
    .where({
      user_id: userId,
      game_id: gameId
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
        game_id: gameId,
        high_score: score
      });
    }
  }

  await db('game_sessions')
    .where({
      user_id: userId,
      game_id: gameId
    })
    .delete();

  return history;
}

module.exports = {
  getActiveGames,
  getAllGames,
  getGameBySlug,
  getGameById,
  saveOrUpdateGameSession,
  getLatestGameSession,
  updateGame,
  createPlayHistoryAndUpdateLeaderboard
};