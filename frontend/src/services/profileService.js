import { apiClient } from "@/lib/apiClient";

export const profileService = {
  // Lấy thông tin user hiện tại (proxy tới /api/auth/me)
  async getMe() {
    return apiClient.get("/auth/me");
  },

  // Lấy thống kê game
  async getStats() {
    return apiClient.get("/users/stats");
  },

  // Lấy lịch sử chơi
  async getHistory(limit = 20) {
    return apiClient.get(`/users/history?limit=${limit}`);
  },

  // Cập nhật profile (username và/hoặc avatar_url)
  async updateProfile(data) {
    return apiClient.put("/users/profile", data);
  },

  // Upload avatar
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/users/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data;
  },
};
