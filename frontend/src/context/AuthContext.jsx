import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { authService } from "@/services/authService";
import { storageService } from "@/lib/storage";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = storageService.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  };

  useEffect(() => {
    const checkUserStatus = () => {
      const token = storageService.getToken();
      const userObj = storageService.getUser();

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
      const response = await authService.login(emailOrUsername, password);
      
      if (response && response.status === "success") {
        // authService đã lưu vào localStorage, giờ cập nhật state
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
      await authService.logout();
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
