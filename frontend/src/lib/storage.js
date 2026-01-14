// Storage utility functions for managing authentication data in localStorage

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const storageService = {
  // Token operations
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // User operations
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  removeUser() {
    localStorage.removeItem(USER_KEY);
  },

  // Auth status
  isAuthenticated() {
    return !!this.getToken();
  },

  // Clear all auth data
  clearAuth() {
    this.removeToken();
    this.removeUser();
  },

  // Get auth headers for API requests
  getAuthHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },
};
