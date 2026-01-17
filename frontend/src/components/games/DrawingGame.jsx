import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Palette, Clock, Save, Download, Trophy, Frown, Target, Zap, Undo2, Lightbulb, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";

// Predefined patterns (10x10 grid indices)
const PATTERNS = [
  // Heart
  [12, 13, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 42, 43, 44, 45, 46, 47, 53, 54, 55, 56, 64, 65, 67, 75],
  // Star
  [4, 5, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 52, 53, 54, 55, 56, 57, 63, 64, 65, 66, 73, 74, 75, 76, 82, 83, 86, 87],
  // Arrow
  [4, 5, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 33, 34, 35, 36, 44, 45, 54, 55, 64, 65, 74, 75, 84, 85],
  // Square
  [11, 12, 13, 14, 15, 16, 17, 18, 21, 28, 31, 38, 41, 48, 51, 58, 61, 68, 71, 78, 81, 82, 83, 84, 85, 86, 87, 88],
  // Diamond
  [4, 5, 13, 14, 15, 16, 22, 23, 26, 27, 31, 32, 37, 38, 41, 48, 51, 58, 62, 63, 66, 67, 73, 74, 75, 76, 84, 85],
  // Letter X
  [0, 9, 11, 18, 22, 27, 33, 36, 44, 45, 54, 55, 63, 66, 72, 77, 81, 88, 90, 99],
  // Smiley
  [22, 23, 26, 27, 32, 33, 36, 37, 51, 58, 62, 63, 66, 67, 73, 74, 75, 76],
  // House
  [4, 5, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 47, 48, 51, 52, 57, 58, 61, 62, 67, 68, 71, 72, 73, 74, 75, 76, 77, 78],
];

const GRID_SIZE = 10;

export default function DrawingGame() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ rows: 10, cols: 10, times: [1, 2, 3] });
  const [gameId, setGameId] = useState(null);

  const [pattern, setPattern] = useState([]);
  const [filledCells, setFilledCells] = useState(new Set());
  const [wrongCells, setWrongCells] = useState(new Set());
  const [cursorPos, setCursorPos] = useState(0);
  const [flashingCell, setFlashingCell] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  // Timer & Score
  const [selectedTimeOption, setSelectedTimeOption] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(1000);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Game state flags
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const timerRef = useRef();
  const elapsedRef = useRef();

  // --- 1. FETCH CONFIG ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await gameService.getGameBySlug("drawing");
        if (response.status === "success") {
          const apiConfig = response.data.config;
          setConfig({
            rows: apiConfig.rows || 10,
            cols: apiConfig.cols || 10,
            times: apiConfig.times || [1, 2, 3]
          });
          setGameId(response.data.id);
          const times = apiConfig.times || [1, 2, 3];
          setTimeLeft(times[0] * 60);
        }
      } catch (error) {
        toast({ title: "Lỗi", description: "Không tải được cấu hình", variant: "destructive" });
        setConfig({ rows: 10, cols: 10, times: [1, 2, 3] });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [toast]);

  // --- INIT GAME ---
  const initGame = useCallback(() => {
    // Random pattern
    const randomPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    // Filter valid indices for 10x10 grid
    const validPattern = randomPattern.filter(i => i >= 0 && i < 100);
    setPattern(validPattern);
    setFilledCells(new Set());
    setWrongCells(new Set());
    setCursorPos(0);
    setUndoStack([]);
    setMistakes(0);
    setHintsUsed(0);
    setScore(1000);
    setGameWon(false);
  }, []);

  // --- CHECK WIN ---
  useEffect(() => {
    if (gameStarted && !gameEnded && pattern.length > 0) {
      const allFilled = pattern.every(idx => filledCells.has(idx));
      if (allFilled) {
        setGameWon(true);
        setGameEnded(true);
        clearInterval(timerRef.current);
        clearInterval(elapsedRef.current);

        // Calculate final score
        const timeBonus = timeLeft * 2;
        const finalScore = Math.max(0, score + timeBonus);
        setScore(finalScore);

        toast({
          title: "🎉 Hoàn thành!",
          description: `Điểm: ${finalScore} | Thời gian: ${elapsedTime}s`,
          className: "bg-emerald-600 border-none text-white"
        });
      }
    }
  }, [filledCells, pattern, gameStarted, gameEnded, score, timeLeft, elapsedTime, toast]);

  // --- TIMER ---
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    elapsedRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
    };
  }, [gameStarted, gameEnded]);

  // --- SAVE HISTORY when game ends ---
  useEffect(() => {
    const saveHistory = async () => {
      if (gameEnded && gameId) {
        try {
          await gameService.savePlayHistory({
            game_id: gameId,
            score: score,
            duration: elapsedTime
          });
        } catch (error) {
          console.error("Failed to save history:", error);
        }
      }
    };
    saveHistory();
  }, [gameEnded, gameId, score, elapsedTime]);

  // --- DRAW CELL ---
  const handleDraw = useCallback(() => {
    if (!gameStarted || gameEnded) return;

    if (filledCells.has(cursorPos) || wrongCells.has(cursorPos)) {
      return; // Already filled
    }

    if (pattern.includes(cursorPos)) {
      // Correct cell!
      setFilledCells(prev => new Set([...prev, cursorPos]));
      setScore(prev => prev + 10);
      toast({
        title: "+10 điểm",
        description: "Đúng ô!",
        className: "bg-emerald-600 border-none text-white",
        duration: 1000
      });
    } else {
      // Wrong cell!
      setWrongCells(prev => new Set([...prev, cursorPos]));
      setFlashingCell(cursorPos);
      setUndoStack(prev => [...prev, cursorPos]);
      setMistakes(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 20));

      toast({
        title: "-20 điểm",
        description: "Sai ô! Nhấn BACK để xóa",
        className: "bg-rose-600 border-none text-white",
        duration: 1500
      });

      setTimeout(() => setFlashingCell(null), 500);
    }
  }, [gameStarted, gameEnded, cursorPos, pattern, filledCells, wrongCells, toast]);

  // --- UNDO ---
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      toast({ title: "Thông báo", description: "Không còn gì để hoàn tác!" });
      return;
    }

    const lastWrong = undoStack[undoStack.length - 1];
    setWrongCells(prev => {
      const newSet = new Set(prev);
      newSet.delete(lastWrong);
      return newSet;
    });
    setUndoStack(prev => prev.slice(0, -1));

    toast({
      title: "Đã xóa",
      description: "Xóa nét sai",
      className: "bg-sky-600 border-none text-white",
      duration: 1000
    });
  }, [undoStack, toast]);

  // --- HINT ---
  const handleHint = useCallback(() => {
    if (!gameStarted || gameEnded) return;

    // Find unfilled pattern cells
    const unfilled = pattern.filter(idx => !filledCells.has(idx));
    if (unfilled.length === 0) return;

    // Auto-fill up to 3 cells
    const toFill = unfilled.slice(0, Math.min(3, unfilled.length));
    setFilledCells(prev => new Set([...prev, ...toFill]));
    setHintsUsed(prev => prev + 1);
    setScore(prev => Math.max(0, prev - 50));

    toast({
      title: "-50 điểm (Hint)",
      description: `AI đã tô ${toFill.length} ô`,
      className: "bg-amber-600 border-none text-white"
    });
  }, [gameStarted, gameEnded, pattern, filledCells, toast]);

  // --- SAVE GAME SESSION ---
  const handleSave = async () => {
    if (!gameId) return;
    setIsSaving(true);
    try {
      await gameService.saveGameSession({
        game_id: gameId,
        matrix_state: JSON.stringify({
          pattern,
          filledCells: [...filledCells],
          wrongCells: [...wrongCells],
          undoStack,
          mistakes,
          hintsUsed
        }),
        current_score: score,
        elapsed_time: elapsedTime
      });
      toast({
        title: "Đã lưu game!",
        description: "Bạn có thể tiếp tục chơi sau",
        className: "bg-sky-600 border-none text-white"
      });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể lưu game", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOAD GAME SESSION ---
  const handleLoad = async () => {
    if (!gameId) return;
    setIsLoadingSession(true);
    try {
      const response = await gameService.getLastSession(gameId);
      if (response.status === "success" && response.data) {
        const session = response.data;
        const state = JSON.parse(session.matrix_state);

        setPattern(state.pattern);
        setFilledCells(new Set(state.filledCells || []));
        setWrongCells(new Set(state.wrongCells || []));
        setUndoStack(state.undoStack || []);
        setMistakes(state.mistakes || 0);
        setHintsUsed(state.hintsUsed || 0);
        setScore(session.current_score || 1000);
        setElapsedTime(session.elapsed_time || 0);
        setGameStarted(true);
        setGameEnded(false);
        setGameWon(false);

        toast({
          title: "Đã load game!",
          description: `Điểm hiện tại: ${session.current_score}`,
          className: "bg-teal-600 border-none text-white"
        });
      }
    } catch (error) {
      toast({ title: "Thông báo", description: "Không tìm thấy game đã lưu", variant: "default" });
    } finally {
      setIsLoadingSession(false);
    }
  };

  // --- START GAME ---
  const startGame = (timeIndex) => {
    const times = config.times || [1, 2, 3];
    setSelectedTimeOption(timeIndex);
    setTimeLeft(times[timeIndex] * 60);
    setElapsedTime(0);
    initGame();
    setGameStarted(true);
    setGameEnded(false);
  };

  // --- CONTROLS ---
  const handleKeyDown = useCallback((e) => {
    if (loading) return;

    // Time selection screen
    if (!gameStarted && !gameEnded) {
      const times = config.times || [1, 2, 3];
      switch (e.key) {
        case "ArrowLeft":
          setSelectedTimeOption(prev => (prev - 1 + times.length) % times.length);
          break;
        case "ArrowRight":
          setSelectedTimeOption(prev => (prev + 1) % times.length);
          break;
        case "Enter":
          startGame(selectedTimeOption);
          break;
        case "l": case "L":
          handleLoad();
          break;
        case "Escape":
          navigate("/home");
          break;
      }
      return;
    }

    // Game ended screen
    if (gameEnded) {
      if (e.key === "Enter") {
        setGameStarted(false);
        setGameEnded(false);
      }
      if (e.key === "Escape") navigate("/home");
      return;
    }

    // During gameplay
    const total = GRID_SIZE * GRID_SIZE;
    switch (e.key) {
      case "ArrowRight":
        setCursorPos(prev => (prev + 1) % total);
        break;
      case "ArrowLeft":
        setCursorPos(prev => (prev - 1 + total) % total);
        break;
      case "ArrowDown":
        setCursorPos(prev => (prev + GRID_SIZE) % total);
        break;
      case "ArrowUp":
        setCursorPos(prev => (prev - GRID_SIZE + total) % total);
        break;
      case "Enter":
        handleDraw();
        break;
      case "h": case "H":
        handleHint();
        break;
      case "Escape": case "Backspace":
        handleUndo();
        break;
      case "s": case "S":
        handleSave();
        break;
    }
  }, [loading, gameStarted, gameEnded, config, selectedTimeOption, handleDraw, handleHint, handleUndo, handleSave, handleLoad, navigate, startGame]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // --- LOADING STATE ---
  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      <span className="text-slate-400 font-mono animate-pulse">LOADING_DRAWING_GAME...</span>
    </div>
  );

  const times = config.times || [1, 2, 3];
  const progress = pattern.length > 0 ? Math.round((filledCells.size / pattern.length) * 100) : 0;

  // --- TIME SELECTION SCREEN ---
  if (!gameStarted && !gameEnded) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-3">
            <Palette className="w-10 h-10 text-emerald-400" />
            DRAWING GAME
          </h2>
          <p className="text-slate-400 text-sm">Tô theo hình mẫu mờ trên ma trận</p>
        </div>

        <div className="flex gap-4">
          {times.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTimeOption(idx)}
              className={cn(
                "px-8 py-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
                selectedTimeOption === idx
                  ? "bg-emerald-500/20 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/30"
                  : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
              )}
            >
              <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-emerald-400" : "text-slate-400")} />
              <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-emerald-400" : "text-slate-300")}>
                {t} phút
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => startGame(selectedTimeOption)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
          >
            BẮT ĐẦU
          </Button>
          <Button
            onClick={handleLoad}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 rounded-2xl"
            disabled={isLoadingSession}
          >
            {isLoadingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            LOAD
          </Button>
        </div>

        <p className="text-slate-600 text-xs font-mono">[←/→] Chọn | [ENTER] Bắt đầu | [L] Load game</p>
      </div>
    );
  }

  // --- GAME END SCREEN ---
  if (gameEnded) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <div className={cn(
          "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
          gameWon ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
        )}>
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            gameWon ? "bg-emerald-500/20" : "bg-rose-500/20"
          )}>
            {gameWon ? <Trophy className="w-12 h-12 text-emerald-400" /> : <Frown className="w-12 h-12 text-rose-400" />}
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-2">
              {gameWon ? "HOÀN THÀNH!" : "HẾT GIỜ!"}
            </h2>
            <p className="text-slate-400">
              Hoàn thành: {progress}% | Lỗi: {mistakes} | Hint: {hintsUsed}
            </p>
          </div>

          <div className="bg-slate-950/50 px-8 py-4 rounded-2xl text-center">
            <span className="text-slate-400 text-sm">TỔNG ĐIỂM</span>
            <p className="text-5xl font-black text-white">{score}</p>
          </div>

          <Button
            onClick={() => { setGameStarted(false); setGameEnded(false); }}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
          >
            CHƠI LẠI
          </Button>
        </div>
      </div>
    );
  }

  // --- MAIN GAME SCREEN ---
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-4xl h-full px-4 py-2 justify-center">

      {/* Stats Bar */}
      <div className="grid grid-cols-5 w-full max-w-2xl gap-2">
        <StatBox label="ĐIỂM" value={score} color="text-emerald-400" icon={<Target className="w-3 h-3" />} />
        <StatBox label="TIẾN ĐỘ" value={`${progress}%`} color="text-violet-400" icon={<Sparkles className="w-3 h-3" />} />
        <StatBox label="LỖI" value={mistakes} color="text-rose-400" icon={<Zap className="w-3 h-3" />} />
        <StatBox
          label="THỜI GIAN"
          value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
          color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
          icon={<Clock className="w-3 h-3" />}
        />
        <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl flex items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleHint}
            className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/20">
            <Lightbulb className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleUndo}
            className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/20">
            <Undo2 className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}
            className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-500/20">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Game Board */}
      <div className="relative">
        <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
        <div
          className="relative grid gap-1 bg-slate-950 p-3 rounded-2xl shadow-2xl border-4 border-slate-700"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'min(90vw, 60vh)',
            aspectRatio: '1/1'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const isPattern = pattern.includes(i);
            const isFilled = filledCells.has(i);
            const isWrong = wrongCells.has(i);
            const isCursor = i === cursorPos;
            const isFlashing = flashingCell === i;

            return (
              <div
                key={i}
                onClick={() => { setCursorPos(i); handleDraw(); }}
                className={cn(
                  "rounded-sm transition-all duration-150 cursor-pointer relative",
                  isCursor && "ring-2 ring-white z-10 scale-110",
                  isFilled && "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]",
                  isWrong && "bg-rose-500/50",
                  isFlashing && "animate-pulse bg-rose-600",
                  !isFilled && !isWrong && isPattern && "bg-emerald-500/20 border border-emerald-500/30",
                  !isFilled && !isWrong && !isPattern && "bg-slate-800/50"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Controls Guide */}
      <div className="text-slate-500 text-xs font-mono text-center">
        [←/→/↑/↓] Di chuyển | [ENTER] Tô | [H] Hint | [BACK] Xóa | [S] Lưu
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-center">
      <div className={cn("flex items-center gap-1 mb-0.5", color)}>
        {icon}
        <span className="text-[8px] font-black tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-mono font-black", color)}>{value}</span>
    </div>
  );
}