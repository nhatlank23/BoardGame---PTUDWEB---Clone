import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { gameService } from "@/services/gameService";
import { Button } from "@/components/ui/button";
export default function DrawingGame() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    rows: 10, cols: 10,
    colors: ["#FFFFFF", "#FF0000", "#00FF00", "#0000FF"],
    times: [5]
  });

  const [board, setBoard] = useState([]);
  const [history, setHistory] = useState([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- 1. LẤY CONFIG TỪ API ---
  useEffect(() => {
    const initGame = async () => {
      try {
        setLoading(true);
        const response = await gameService.getGameBySlug("drawing");
        if (response.status === "success") {
          const apiConfig = response.data.config;
          const r = apiConfig.rows || 10;
          const c = apiConfig.cols || 10;

          setConfig({
            rows: r, cols: c,
            colors: apiConfig.colors || ["#FFFFFF"],
            times: apiConfig.times || [5]
          });

          setBoard(Array(r * c).fill(null));
          if (apiConfig.times?.length > 0) setTimeLeft(apiConfig.times[0] * 60);
          setIsPlaying(true);
        }
      } catch (error) {
        toast({ title: "Lỗi", description: "Không tải được cấu hình", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    initGame();
  }, [toast]);

  // --- 2. TIMER ---
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // --- 3. CHỨC NĂNG UNDO ---
  const performUndo = useCallback(() => {
    if (history.length === 0) {
      toast({ title: "Thông báo", description: "Không còn gì để hoàn tác!" });
      return;
    }
    const previousBoard = history[history.length - 1];
    setBoard(previousBoard);

    setHistory((prev) => prev.slice(0, -1));

    toast({
      description: "Đã hoàn tác bước vẽ",
      duration: 1000,
      icon: <Undo2 className="w-4 h-4 text-emerald-500" />
    });
  }, [history, toast]);

  // --- 4. XỬ LÝ PHÍM (5 NÚT CHỨC NĂNG) ---
  const handleKeyDown = useCallback((e) => {
    if (!isPlaying) return;
    const totalCells = config.rows * config.cols;

    switch (e.key) {
      case "ArrowRight":
        setCursorPos((prev) => (prev + 1) % totalCells);
        break;
      case "ArrowLeft":
        setCursorPos((prev) => (prev - 1 + totalCells) % totalCells);
        break;

      case "Enter":
        setHistory((prev) => [...prev, [...board]].slice(-20));
        setBoard((prevBoard) => {
          const newBoard = [...prevBoard];
          const currentColor = config.colors[colorIndex];
          newBoard[cursorPos] = newBoard[cursorPos] === currentColor ? null : currentColor;
          return newBoard;
        });
        break;
      case "h": case "H":
        setColorIndex((prev) => (prev + 1) % config.colors.length);
        break;

      case "Escape":
        if (history.length > 0) {
          performUndo();
        } else {
          if (window.confirm("Quay về Menu chính?")) navigate("/home");
        }
        break;
    }
  }, [isPlaying, config, colorIndex, cursorPos, board, history, performUndo, navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-12 h-12" /></div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full p-4 items-center">
      <div className="flex-1 flex justify-center">
        <div
          className="grid gap-1 bg-black p-4 rounded-xl border-[8px] border-slate-800 shadow-2xl"
          style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
        >
          {board.map((color, i) => (
            <div
              key={i}
              className={`rounded-sm transition-all duration-150 ${i === cursorPos ? 'ring-4 ring-white z-10 scale-110' : ''} ${config.cols > 10 ? 'w-6 h-6' : 'w-10 h-10'}`}
              style={{ backgroundColor: color || "#1e293b", boxShadow: color ? `0 0 10px ${color}` : "none" }}
            >
              {i === cursorPos && !color && (
                <div className="absolute inset-0 opacity-40 animate-pulse" style={{ backgroundColor: config.colors[colorIndex] }} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="w-64 space-y-4">
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-3 uppercase text-[10px] font-bold tracking-widest">
            <Palette className="w-4 h-4" /> Brush Color
          </div>
          <div className="grid grid-cols-4 gap-2">
            {config.colors.map((c, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full border-2 transition-all ${idx === colorIndex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}