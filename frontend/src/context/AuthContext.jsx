import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AuthContext = createContext();

const API_URL = 'http://localhost:3000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWithAuth = async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        return response;
    };

    useEffect(() => {
        const checkUserStatus = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetchWithAuth('/auth/profile');
                const data = await response.json();

                if (response.ok) {
                    if (data.is_banned) {
                        alert("Tài khoản của bạn đã bị khóa!");
                        logout();
                    } else {
                        setUser(data);
                        setIsAuthenticated(true);
                    }
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Lỗi xác thực hệ thống:", error);
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
                setIsAuthenticated(true);
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Đăng nhập thất bại' };
            }
        } catch (error) {
            return { success: false, message: 'Lỗi kết nối server' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, fetchWithAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
};

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <p>Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};