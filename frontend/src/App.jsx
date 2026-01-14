import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import HomePage from "./pages/HomePage";
import Profile from "./pages/Profile";
import LandingPage from "./pages/LandingPage";
import MessagesPage from "./pages/Messages";
import FriendsPage from "./pages/Friends";
import GameConfig from "./pages/admin/GameConfig";
import AuthPage from "./pages/Auth";
import Users from "./pages/admin/Users";
import Games from "./pages/admin/Games";
import Ranking from "./pages/Ranking";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Đang kiểm tra quyền Admin...</div>;
  return user?.role === "admin" ? children : <Navigate to="/home" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/admin/dashboard" element={<div className="text-xl">Admin Dashboard</div>} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/games" element={<Games />} />
        {/* --- PROTECTED ROUTES (Phải đăng nhập mới vào được) --- */}
        <Route element={<ProtectedRoute />}>
          {/* Nhóm Route dành cho User thường */}
          {/* <Route element={<Layout isAdmin={false} />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/ranking" element={<div className="text-xl">Ranking Page</div>} />
          </Route> */}

          {/* Nhóm Route dành riêng cho ADMIN */}
          {/* <Route element={<AdminRoute><Layout isAdmin={true} /></AdminRoute>}>
            <Route path="/admin/dashboard" element={<div className="text-xl">Admin Dashboard</div>} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/games" element={<Games />} />
            <Route path="/admin/games/:gameId/config" element={<GameConfig />} />
          </Route> */}
        </Route>

        {/* Fallback - Redirect về trang chủ nếu gõ sai URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
