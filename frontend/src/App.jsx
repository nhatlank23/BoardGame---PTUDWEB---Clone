import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Routes>
      {/* Public route - Không có layout */}
      <Route path="/" element={<LoginPage />} />

      {/* Protected routes - Có Header + Sidebar */}
      <Route element={<Layout isAdmin={false} />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/friends" element={<div className="text-xl">Friends Page</div>} />
        <Route path="/messages" element={<div className="text-xl">Messages Page</div>} />
        <Route path="/ranking" element={<div className="text-xl">Ranking Page</div>} />
      </Route>

      {/* Admin routes - Có Header + Sidebar (admin version) */}
      <Route element={<Layout isAdmin={true} />}>
        <Route path="/admin/dashboard" element={<div className="text-xl">Admin Dashboard</div>} />
        <Route path="/admin/users" element={<div className="text-xl">Quản lý Users</div>} />
        <Route path="/admin/games" element={<div className="text-xl">Quản lý Games</div>} />
      </Route>

      {/* Fallback - Redirect về home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;

