// Authentication service - handles all auth-related API calls
import { apiClient } from "@/lib/apiClient";
import { storageService } from "@/lib/storage";

export const authService = {
  // Đăng ký tài khoản mới
  async register(username, email, password, confirmPassword) {
    const response = await apiClient.post(
      "/auth/register",
      {
        username,
        email,
        password,
        confirmPassword,
      },
      { skipAutoLogout: true }
    );

    if (response.data?.token) {
      storageService.setToken(response.data.token);
      storageService.setUser(response.data.user);
    }

    return response;
  },

  // Đăng nhập
  async login(emailOrUsername, password) {
    const response = await apiClient.post(
      "/auth/login",
      {
        emailOrUsername,
        password,
      },
      { skipAutoLogout: true }
    );

    if (response.data?.token) {
      storageService.setToken(response.data.token);
      storageService.setUser(response.data.user);
    }

    return response;
  },

  // Đăng xuất
  async logout() {
    try {
      // Gọi API logout (optional, vì JWT stateless)
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Luôn xóa token khỏi localStorage dù API có lỗi
      storageService.clearAuth();
    }
  },

  // Lấy thông tin user hiện tại
  async getMe() {
    return await apiClient.get("/auth/me");
  },

  // Refresh token (nếu có implement)
  async refreshToken() {
    const response = await apiClient.post("/auth/refresh", {});
    if (response.data?.token) {
      storageService.setToken(response.data.token);
    }
    return response;
  },
};
