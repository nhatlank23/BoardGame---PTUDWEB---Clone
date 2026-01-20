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
import Dashboard from "./pages/admin/Dashboard";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import GamePlayPage from "./pages/GamePlay";

// const AdminRoute = ({ children }) => {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//         <p>Đang kiểm tra quyền Admin...</p>
//       </div>
//     );
//   }

//   return user?.role === "admin" ? children : <Navigate to="/home" replace />;
// };

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* --- PUBLIC ROUTES (Ai cũng vào được) --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
                 
        {/* User routes with Layout */}
        <Route element={<Layout />}>


          
          {/* --- PROTECTED ROUTES (Phải đăng nhập mới vào được) --- */}
          <Route element={<ProtectedRoute />}>
           <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/game/:slug/play" element={<GamePlayPage />} />
          </Route>
        </Route>

        {/* Admin routes with Layout */}
        <Route element={<Layout isAdmin={true} />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/games" element={<Games />} />
            <Route path="/admin/games/:gameId/config" element={<GameConfig />} />
          </Route>
        </Route>

        {/* Fallback - Redirect về trang chủ nếu gõ sai URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
