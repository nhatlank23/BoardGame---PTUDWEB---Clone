import { apiClient } from "@/lib/apiClient";

export const gameService = {
  // NHÓM DÀNH CHO NGƯỜI CHƠI
  // 1. Lấy danh sách game đang hoạt động (is_active = true)
  getActiveGames: async () => {
    return await apiClient.get("/games");
  },

  // 1. Lấy tất cả games (bao gồm cả is_active = false) - cho admin
  getAllGamesForAdmin: async () => {
    return await apiClient.get("/games/all");
  },

  // 2. Lấy chi tiết game bằng slug
  getGameBySlug: async (slug) => {
    return await apiClient.get(`/games/${slug}`);
  },

  // 3. Lưu trạng thái chơi dở (Save game)
  // payload: { game_id, matrix_state, current_score, elapsed_time }
  saveGameSession: async (payload) => {
    return await apiClient.post("/sessions/save", payload);
  },

  // 4. Load trạng thái chơi gần nhất
  getLastSession: async (gameId) => {
    return await apiClient.get(`/sessions/${gameId}`);
  },

  // 5. Lưu lịch sử sau khi kết thúc lượt chơi (End game)
  // payload: { game_id, score, duration }
  savePlayHistory: async (payload) => {
    return await apiClient.post("/history", payload);
  },

  // NHÓM DÀNH CHO ADMIN
  // 6. Cập nhật thông tin game (Bật/tắt game, sửa cấu hình)
  // payload: { name, is_active, config }
  updateGame: async (gameId, payload) => {
    return await apiClient.patch(`/games/${gameId}`, payload);
  },
};
