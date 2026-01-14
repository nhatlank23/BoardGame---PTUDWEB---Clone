import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

const AuthContext = createContext();

const API_URL = "http://localhost:3000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
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

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = data.data?.user || data.user;
        const token = data.data?.token || data.token;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      } else {
        return { success: false, message: data.message || "Đăng nhập thất bại" };
      }
    } catch (error) {
      return { success: false, message: "Lỗi kết nối server" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
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
