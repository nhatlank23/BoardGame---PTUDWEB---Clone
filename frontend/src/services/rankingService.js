import { apiClient } from "@/lib/apiClient";

export const rankingService = {
  // NHÓM DÀNH CHO NGƯỜI CHƠI
  // 1. Lấy danh sách game đang hoạt động (is_active = true)
  getTopLeaderBoard: async (gameId, page = 1, pageSize = 50) => {
    return await apiClient.get(`/leaderboards/${gameId}?page=${page}&pageSize=${pageSize}`);
  },

  getTopFriendLeaderBoard: async (gameId, page = 1, pageSize = 50) => {
    return await apiClient.get(`/leaderboards/${gameId}/friends?page=${page}&pageSize=${pageSize}`);
  },
};
