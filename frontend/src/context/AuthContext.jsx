import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { authAPI, authService } from "@/lib/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = authService.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const API_URL = "http://localhost:3000/api";
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  };

  useEffect(() => {
    const checkUserStatus = () => {
      const token = authService.getToken();
      const userObj = authService.getUser();

      if (!token || !userObj) {
        setIsLoading(false);
        return;
      }

      try {
        setUser(userObj);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Lỗi parse user data:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const response = await authAPI.login(emailOrUsername, password);

      if (response && response.status === "success") {
        // authAPI đã lưu vào localStorage, giờ cập nhật state
        const userData = response.data?.user;
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      } else {
        return { success: false, message: response?.message || "Đăng nhập thất bại" };
      }
    } catch (error) {
      return { success: false, message: error.message || "Lỗi kết nối server" };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Xóa state ngay lập tức
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, fetchWithAuth }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};
