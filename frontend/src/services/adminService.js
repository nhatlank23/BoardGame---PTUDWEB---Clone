import { apiClient } from "@/lib/apiClient";

export const adminService = {
  async getStatsSummary() {
    return await apiClient.get("/admin/stats/summary");
  },

  async getAllUsers({ page = 1, limit = 5, status = 'all', search = '' }) {
    const params = new URLSearchParams({
      page,
      limit,
      status,
      search
    });
    return await apiClient.get(`/admin/users?${params.toString()}`);
  },

  async getSearchUser(q) {
    return await apiClient.get(`/users/search?q=${q}`);
  },

  async toggleBanUser(userId, isBanned) {
    return await apiClient.patch(`/admin/users/${userId}/ban`, {
      is_banned: isBanned,
    });
  },

  async getGamesPlayed() {
    return await apiClient.get("/admin/stats/games-played");
  },

  async getHourlyActivity(gameId = null) {
    const endpoint = gameId ? `/admin/stats/hourly-activity?game_id=${gameId}` : "/admin/stats/hourly-activity";
    return await apiClient.get(endpoint);
  },
};
