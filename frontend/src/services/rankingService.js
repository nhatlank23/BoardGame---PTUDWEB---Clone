import { apiClient } from "@/lib/apiClient";

export const rankingService = {
  // NHÓM DÀNH CHO NGƯỜI CHƠI
  // 1. Lấy danh sách game đang hoạt động (is_active = true)
  getTopLeaderBoard: async (gameId) => {
    return await apiClient.get(`/leaderboards/${gameId}`);
  },

  getTopFriendLeaderBoard: async (gameId) => {
    return await apiClient.get(`/leaderboards/${gameId}/friends`);
  },
};
