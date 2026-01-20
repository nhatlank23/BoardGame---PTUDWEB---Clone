// HTTP client for API requests
import { storageService } from "@/lib/storage";

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY;
const getFullHeaders = () => ({
  ...storageService.getAuthHeaders(),
  "x-api-key": API_KEY,
});
export const apiClient = {
  // POST request
  async post(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getFullHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // GET request
  async get(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: getFullHeaders(),
    });
    return this.handleResponse(response, options);
  },

  // PUT request
  async put(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getFullHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // PATCH request
  async patch(endpoint, data, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: getFullHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, options);
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getFullHeaders(),
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
        window.location.href = "/auth";
      }
      throw new Error(data.message || "API request failed");
    }

    return data;
  },
};
