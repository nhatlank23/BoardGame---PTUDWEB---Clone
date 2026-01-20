import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { GameController } from "@/components/games/GameController";
import { gameService } from "@/services/gameService";
import { useToast } from "@/hooks/use-toast";

const MATRIX_ICONS = {
  "caro-5": [
    [2, 2, "#ef4444"],
    [3, 3, "#ef4444"],
    [4, 4, "#ef4444"],
    [5, 5, "#ef4444"],
    [6, 6, "#ef4444"],
    [7, 7, "#ef4444"],
    [2, 7, "#ef4444"],
    [3, 6, "#ef4444"],
    [4, 5, "#ef4444"],
    [5, 4, "#ef4444"],
    [6, 3, "#ef4444"],
    [7, 2, "#ef4444"],
    [0, 0, "#3b82f6"],
    [0, 9, "#3b82f6"],
    [9, 0, "#3b82f6"],
    [9, 9, "#3b82f6"],
  ],

  "caro-4": [
    [2, 3, "#f59e0b"],
    [3, 3, "#f59e0b"],
    [4, 3, "#f59e0b"],
    [5, 3, "#f59e0b"],
    [5, 2, "#f59e0b"],
    [5, 4, "#f59e0b"],
    [5, 5, "#f59e0b"],
    [3, 2, "#f59e0b"],
    [2, 2, "#f59e0b"],
  ],

  "tic-tac-toe": [
    [3, 4, "#ffffff"],
    [4, 4, "#ffffff"],
    [5, 4, "#ffffff"],
    [6, 4, "#ffffff"],
    [4, 3, "#ffffff"],
    [4, 5, "#ffffff"],
    [4, 6, "#ffffff"],
    [5, 5, "#ef4444"],
    [3, 3, "#3b82f6"],
  ],

  snake: [
    [4, 3, "#22c55e"],
    [4, 4, "#22c55e"],
    [4, 5, "#22c55e"],
    [3, 5, "#22c55e"],
    [3, 6, "#4ade80"],
    [6, 7, "#dc2626"],
  ],

  "match-3": [
    [3, 3, "#ec4899"],
    [3, 4, "#ec4899"],
    [3, 5, "#ec4899"],
    [5, 3, "#eab308"],
    [5, 4, "#a855f7"],
    [5, 5, "#06b6d4"],
    [4, 4, "#ffffff"],
  ],

  memory: [
    [3, 3, "#8b5cf6"],
    [6, 6, "#8b5cf6"],
    [3, 6, "#f43f5e"],
    [6, 3, "#f43f5e"],
    [4, 4, "#64748b"],
    [4, 5, "#64748b"],
    [5, 4, "#64748b"],
    [5, 5, "#64748b"],
  ],

  drawing: [
    [2, 2, "#ef4444"],
    [3, 3, "#f97316"],
    [4, 4, "#eab308"],
    [5, 5, "#22c55e"],
    [6, 6, "#3b82f6"],
    [7, 7, "#8b5cf6"],
    [8, 8, "#db2777"],
  ],
};

export default function HomePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await gameService.getActiveGames();
        if (response.status === "success") {
          setGames(response.data);
        } else {
          toast({ title: "Lỗi", description: "Không tải được dữ liệu game", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [toast]);

  // 2. Logic điều hướng 5 nút
  const handleNext = useCallback(() => {
    if (games.length > 0) setSelectedIndex((prev) => (prev + 1) % games.length);
  }, [games.length]);

  const handlePrev = useCallback(() => {
    if (games.length > 0) setSelectedIndex((prev) => (prev - 1 + games.length) % games.length);
  }, [games.length]);

  const handleEnter = useCallback(() => {
    if (games[selectedIndex]) {
      navigate(`/game/${games[selectedIndex].slug}/play`);
    }
  }, [games, selectedIndex, navigate]);

  const handleBack = useCallback(() => {
    toast({ title: "System", description: "Bạn đang ở Menu chính." });
  }, [toast]);

  const handleHint = useCallback(() => {
    const gameName = games[selectedIndex]?.name || "Game";
    toast({
      title: `Thông tin: ${gameName}`,
      description: "Dùng TRÁI/PHẢI để chọn. ENTER để chơi.",
      className: "bg-slate-900 text-white border-emerald-500",
    });
  }, [games, selectedIndex, toast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || games.length === 0) return;
      switch (e.key) {
        case "ArrowRight":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "Enter":
          handleEnter();
          break;
        case "h":
        case "H":
          handleHint();
          break;
        case "Escape":
          handleBack();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, handleEnter, handleBack, handleHint, loading, games.length]);

  const renderMatrix = () => {
    const board = Array(10)
      .fill(null)
      .map(() => Array(10).fill(null));
    const currentGame = games[selectedIndex];
    const pixelData = MATRIX_ICONS[currentGame?.slug] || [];

    pixelData.forEach(([r, c, color]) => {
      if (r >= 0 && r < 10 && c >= 0 && c < 10) {
        board[r][c] = color;
      }
    });

    return (
      <div className="grid grid-cols-10 gap-2 bg-slate-950 dark:bg-black p-6 rounded-xl border-[8px] border-slate-300 dark:border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {board.flat().map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: color || "#1e293b",
              boxShadow: color ? `0 0 10px ${color}` : "none",
              transform: color ? "scale(1.1)" : "scale(1)",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-background text-foreground overflow-hidden font-sans">
      <main className="p-8 flex flex-col">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center my-auto">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col items-center">
              {loading ? (
                <div className="h-[360px] w-[360px] flex items-center justify-center bg-slate-900 dark:bg-slate-900 rounded-xl border-4 border-slate-800">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                </div>
              ) : (
                renderMatrix()
              )}
            </div>
            <div className="w-full max-w-sm">
              <GameController onLeft={handlePrev} onRight={handleNext} onEnter={handleEnter} onBack={handleBack} onHint={handleHint} />
            </div>
          </div>

          <div className="space-y-6">
            {!loading && games[selectedIndex] && (
              <div className="animate-in slide-in-from-right duration-500">
                <h1 className="text-6xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground">
                  {games[selectedIndex].name}
                </h1>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
