import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/Auth";
import RankingPage from "./pages/Ranking";

function App() {
  return (
    <div className="font-sans antialiased">
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/ranking" element={<RankingPage />} />
      </Routes>
    </div>
  );
}

export default App;
