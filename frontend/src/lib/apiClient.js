// HTTP client for API requests
import { storageService } from "@/lib/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiClient = {
  // POST request
  async post(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: storageService.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // GET request
  async get(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: storageService.getAuthHeaders(),
    });
    return this.handleResponse(response, options);
  },

  // PUT request
  async put(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: storageService.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: storageService.getAuthHeaders(),
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
        storageService.clearAuth();
        window.location.href = "/";
      }
      throw new Error(data.message || "API request failed");
    }

    return data;
  },
};
