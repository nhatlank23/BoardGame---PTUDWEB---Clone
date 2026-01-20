import { apiClient } from "@/lib/apiClient";

export const profileService = {
  // Lấy thông tin user hiện tại (proxy tới /api/auth/me)
  async getMe() {
    return apiClient.get("/auth/me");
  },

  // Lấy thông tin user khác theo ID
  async getUserProfile(userId) {
    return apiClient.get(`/users/${userId}/profile`);
  },

  // Lấy thống kê game của user hiện tại
  async getStats() {
    return apiClient.get("/users/stats");
  },

  // Lấy thống kê game của user khác theo ID
  async getUserStats(userId) {
    return apiClient.get(`/users/${userId}/stats`);
  },

  // Lấy lịch sử chơi của user hiện tại
  async getHistory(limit = 20) {
    return apiClient.get(`/users/history?limit=${limit}`);
  },

  // Lấy lịch sử chơi của user khác theo ID
  async getUserHistory(userId, limit = 20) {
    return apiClient.get(`/users/${userId}/history?limit=${limit}`);
  },

  // Cập nhật profile (username và/hoặc avatar_url)
  async updateProfile(data) {
    return apiClient.put("/users/profile", data);
  },

  // Upload avatar
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const VITE_API_URL = import.meta.env.VITE_API_URL;
    const VITE_API_KEY = import.meta.env.VITE_API_KEY;
    const token = localStorage.getItem("token");

    const response = await fetch(`${VITE_API_URL}/users/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": VITE_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data;
  },

  // Get achievement
  async getAchievement(page = 1, pageSize = 50) {
    return apiClient.get(`/users/achievements?page=${page}&pageSize=${pageSize}`);
  },
};
