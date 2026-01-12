// Auth utility functions for managing JWT token in localStorage

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const authService = {
  // Lưu token vào localStorage
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Lấy token từ localStorage
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Xóa token khỏi localStorage
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Lưu thông tin user
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Lấy thông tin user
  getUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  // Xóa thông tin user
  removeUser() {
    localStorage.removeItem(USER_KEY);
  },

  // Check xem user đã đăng nhập chưa
  isAuthenticated() {
    return !!this.getToken();
  },

  // Xóa tất cả dữ liệu auth (logout)
  clearAuth() {
    this.removeToken();
    this.removeUser();
  },

  // Lấy headers với Bearer token cho API calls
  getAuthHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },
};

// API service với axios-like interface (sử dụng fetch)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiClient = {
  // POST request
  async post(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // GET request
  async get(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: authService.getAuthHeaders(),
    });
    return this.handleResponse(response, options);
  },

  // PUT request
  async put(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: authService.getAuthHeaders(),
    });
    return this.handleResponse(response, options);
  },

  // Handle API response
  async handleResponse(response, options = {}) {
    const data = await response.json();

    if (!response.ok) {
      // Nếu token expired hoặc invalid, tự động logout trừ khi caller yêu cầu bỏ qua
      const skipAutoLogout = options.skipAutoLogout === true;
      if (response.status === 401 && !skipAutoLogout) {
        authService.clearAuth();
        window.location.href = "/";
      }
      throw new Error(data.message || "API request failed");
    }

    return data;
  },
};

// Auth API functions
export const authAPI = {
  // Đăng ký
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
      authService.setToken(response.data.token);
      authService.setUser(response.data.user);
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
      authService.setToken(response.data.token);
      authService.setUser(response.data.user);
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
      authService.clearAuth();
    }
  },

  // Lấy thông tin user hiện tại
  async getMe() {
    return await apiClient.get("/auth/me");
  },
};
