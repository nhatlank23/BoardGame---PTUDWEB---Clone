export const gameService = (fetchWithAuth) => ({
  // NHÓM DÀNH CHO NGƯỜI CHƠI
  // 1. Lấy danh sách game đang hoạt động (is_active = true)
  getActiveGames: async () => {
    const res = await fetchWithAuth("/games");
    return res.json();
  },

  // 2. Lấy chi tiết game bằng slug
  getGameBySlug: async (slug) => {
    const res = await fetchWithAuth(`/games/${slug}`);
    return res.json();
  },

  // 3. Lưu trạng thái chơi dở (Save game)
  // payload: { game_id, matrix_state, current_score, elapsed_time }
  saveGameSession: async (payload) => {
    const res = await fetchWithAuth("/sessions/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // 4. Load trạng thái chơi gần nhất
  getLastSession: async (gameId) => {
    const res = await fetchWithAuth(`/sessions/${gameId}`);
    return res.json();
  },

  // 5. Lưu lịch sử sau khi kết thúc lượt chơi (End game)
  // payload: { game_id, score, duration }
  savePlayHistory: async (payload) => {
    const res = await fetchWithAuth("/history", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // NHÓM DÀNH CHO ADMIN
  // 6. Cập nhật thông tin game (Bật/tắt game, sửa cấu hình)
  // payload: { name, is_active, config }
  updateGame: async (gameId, payload) => {
    const res = await fetchWithAuth(`/game/${gameId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.json();
  },
});
