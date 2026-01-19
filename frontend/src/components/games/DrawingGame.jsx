import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Palette, Clock, Trophy, Frown, Target, Sparkles, ChevronLeft, ChevronRight, CornerDownLeft, ArrowLeft, Lightbulb, HelpCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PATTERNS = [
  [12, 13, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 42, 43, 44, 45, 46, 47, 53, 54, 55, 56, 64, 65, 67, 75],
  [4, 5, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 52, 53, 54, 55, 56, 57, 63, 64, 65, 66, 73, 74, 75, 76, 82, 83, 86, 87],
  [4, 5, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 33, 34, 35, 36, 44, 45, 54, 55, 64, 65, 74, 75, 84, 85],
  [11, 12, 13, 14, 15, 16, 17, 18, 21, 28, 31, 38, 41, 48, 51, 58, 61, 68, 71, 78, 81, 82, 83, 84, 85, 86, 87, 88],
  [4, 5, 13, 14, 15, 16, 22, 23, 26, 27, 31, 32, 37, 38, 41, 48, 51, 58, 62, 63, 66, 67, 73, 74, 75, 76, 84, 85],
  [22, 23, 26, 27, 32, 33, 36, 37, 51, 58, 62, 63, 66, 67, 73, 74, 75, 76],
  [4, 5, 13, 14, 15, 16, 22, 23, 24, 25, 26, 27, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 47, 48, 51, 52, 57, 58, 61, 62, 67, 68, 71, 72, 73, 74, 75, 76, 77, 78],
];

const GRID_SIZE = 10;

const GAME_INSTRUCTIONS = [
  {
    title: "Nhiệm vụ của bạn",
    content: "Quan sát hình mẫu và tái hiện lại trên bàng game. Hãy hoàn thành 100% hình vẽ trước khi đồng hồ đếm ngược về 0."
  },
  {
    title: "Cách thức tương tác",
    content: "Sử dụng CHUỘT trái để chọn ô. Di chuyển con trỏ chuột đến vị trí mong muốn và CLICK vào các ô có màu Xanh nhạt (ô gợi ý) để thực hiện tô màu."
  },
  {
    title: "Nhận diện màu sắc",
    content: "Ô mờ (Xanh nhạt) là vị trí cần tô. Ô Xanh đậm là bạn đã tô đúng. Nếu ô chuyển ĐỎ, nghĩa là bạn đã tô sai vị trí mẫu."
  },
  {
    title: "Hệ thống điểm & Phạt",
    content: "Tô đúng: +10 điểm. Tô sai: -20 điểm và mất thời gian. Hãy thật cẩn thận để không làm giảm điểm số của mình."
  },
  {
    title: "Quyền trợ giúp (Hint)",
    content: "Nhấn phím HINT nếu bạn không tô kịp. AI sẽ tự động tô đúng 3 ô ngẫu nhiên giúp bạn, nhưng bạn sẽ bị trừ 50 điểm phí trợ giúp."
  },
  {
    title: "Điều kiện chiến thắng",
    content: "Ván game kết thúc khi bạn phủ kín các ô theo đúng hình mẫu. Điểm thưởng cuối ván sẽ dựa trên lượng thời gian bạn còn dư."
  }
];

const CELL_COLORS = {
  empty: "bg-slate-800/50 hover:bg-slate-700/50",
  pattern: "bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/40",
  filled: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]",
  wrong: "bg-rose-500/50",
  hinted: "ring-2 ring-amber-400 animate-pulse",
};

export default function DrawingGame() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ rows: 10, cols: 10, times: [5, 10, 20] });
  const [gameId, setGameId] = useState(null);

  const [pattern, setPattern] = useState([]);
  const [filledCells, setFilledCells] = useState(new Set());
  const [wrongCells, setWrongCells] = useState(new Set());
  const [hintedCells, setHintedCells] = useState([]);

  const [selectedTimeOption, setSelectedTimeOption] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [totalGameTime, setTotalGameTime] = useState(300);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(1000);
  const [mistakes, setMistakes] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const timerRef = useRef();
  const elapsedRef = useRef();

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
            times: apiConfig.times || [5, 10, 20]
          });
          setGameId(response.data.id);
          const times = apiConfig.times || [5, 10, 20];
          setTimeLeft(times[0] * 60);
          setTotalGameTime(times[0] * 60);
        }
      } catch (error) {
        toast({ title: "Lỗi", description: "Không tải được cấu hình", variant: "destructive" });
        setConfig({ rows: 10, cols: 10, times: [5, 10, 20] });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [toast]);

  const initGame = useCallback(() => {
    const randomPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const validPattern = randomPattern.filter(i => i >= 0 && i < 100);
    setPattern(validPattern);
    setFilledCells(new Set());
    setWrongCells(new Set());
    setHintedCells([]);
    setMistakes(0);
    setScore(1000);
    setGameWon(false);
  }, []);

  useEffect(() => {
    if (gameStarted && !gameEnded && pattern.length > 0) {
      const allFilled = pattern.every(idx => filledCells.has(idx));
      if (allFilled) {
        setGameWon(true);
        setGameEnded(true);
        clearInterval(timerRef.current);
        clearInterval(elapsedRef.current);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      const times = config.times || [5, 10, 20];

      if (!gameStarted) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            setSelectedTimeOption(prev => Math.max(0, prev - 1));
            break;
          case "ArrowRight":
            e.preventDefault();
            setSelectedTimeOption(prev => Math.min(times.length - 1, prev + 1));
            break;
          case "Enter":
            e.preventDefault();
            startGame(selectedTimeOption);
            break;
          case "h":
          case "H":
            e.preventDefault();
            setShowInstructions(true);
            break;
          case "Escape":
          case "Backspace":
            e.preventDefault();
            navigate("/home");
            break;
        }
        return;
      }

      if (!gameEnded) {
        switch (e.key) {
          case "h":
          case "H":
            e.preventDefault();
            // Hint inline - show cells then auto-fill
            const unfilled = pattern.filter(idx => !filledCells.has(idx));
            if (unfilled.length > 0) {
              const toFill = unfilled.slice(0, Math.min(3, unfilled.length));
              setHintedCells(toFill);
              setScore(prev => Math.max(0, prev - 50));
              setTimeout(() => {
                setFilledCells(prev => new Set([...prev, ...toFill]));
                setHintedCells([]);
              }, 1500);
            }
            break;
          case "Escape":
          case "Backspace":
            e.preventDefault();
            // Pause and show exit dialog
            clearInterval(timerRef.current);
            clearInterval(elapsedRef.current);
            setShowExitDialog(true);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, gameStarted, gameEnded, selectedTimeOption, config, navigate, pattern, filledCells]);

  const handleCellClick = useCallback((idx) => {
    if (!gameStarted || gameEnded) return;
    if (filledCells.has(idx) || wrongCells.has(idx)) return;

    setHintedCells([]);

    if (pattern.includes(idx)) {
      setFilledCells(prev => new Set([...prev, idx]));
      setScore(prev => prev + 10);
      toast({
        title: "+10 điểm",
        description: "Đúng ô!",
        className: "bg-emerald-600 border-none text-white",
        duration: 1000
      });
    } else {
      setWrongCells(prev => new Set([...prev, idx]));
      setMistakes(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 20));

      toast({
        title: "-20 điểm",
        description: "Sai ô!",
        className: "bg-rose-600 border-none text-white",
        duration: 1500
      });
    }
  }, [gameStarted, gameEnded, pattern, filledCells, wrongCells, toast]);

  const handleBackFromConfig = () => {
    if (score < 1000) {
      setShowExitDialog(true);
    } else {
      navigate("/home");
    }
  };

  const handleExitWithSave = async () => {
    await handleSave();
    setShowExitDialog(false);
    navigate("/home");
  };

  const handleExitWithoutSave = () => {
    setShowExitDialog(false);
    navigate("/home");
  };

  const handleLeft = () => {
    if (!gameStarted) setSelectedTimeOption(prev => Math.max(0, prev - 1));
  };

  const handleRight = () => {
    if (!gameStarted) {
      const times = config.times || [5, 10, 20];
      setSelectedTimeOption(prev => Math.min(times.length - 1, prev + 1));
    }
  };

  const handleEnter = () => {
    if (!gameStarted) startGame(selectedTimeOption);
  };

  const handleBack = () => {
    if (gameStarted && !gameEnded) {
      // Pause the game and show exit dialog
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
      setShowExitDialog(true);
    } else if (!gameStarted) {
      handleBackFromConfig();
    }
  };

  // Handle exit with save from gameplay
  const handleExitGameWithSave = async () => {
    await handleSave();
    setShowExitDialog(false);
    setGameStarted(false);
    setGameEnded(false);
  };

  // Handle exit without save from gameplay
  const handleExitGameWithoutSave = () => {
    setShowExitDialog(false);
    setGameStarted(false);
    setGameEnded(false);
  };

  // Handle cancel exit (resume game)
  const handleCancelExit = () => {
    setShowExitDialog(false);
    // Resume timers if game was in progress
    if (gameStarted && !gameEnded) {
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
    }
  };

  const handleHint = useCallback(() => {
    if (!gameStarted) {
      setShowInstructions(true);
      return;
    }

    if (gameEnded) return;

    const unfilled = pattern.filter(idx => !filledCells.has(idx));
    if (unfilled.length === 0) return;

    const toFill = unfilled.slice(0, Math.min(3, unfilled.length));

    // First highlight the cells
    setHintedCells(toFill);
    setScore(prev => Math.max(0, prev - 50));

    toast({
      title: "💡 -50 điểm (Hint)",
      description: `${toFill.length} ô đang nhấp nháy`,
      className: "bg-amber-600 border-none text-white"
    });

    // After delay, fill them
    setTimeout(() => {
      setFilledCells(prev => new Set([...prev, ...toFill]));
      setHintedCells([]);
    }, 1500);
  }, [gameStarted, gameEnded, pattern, filledCells, toast]);

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
          mistakes,
          timeLeft,
          totalGameTime
        }),
        current_score: score,
        elapsed_time: elapsedTime
      });
      toast({
        title: "💾 Đã lưu game!",
        description: "Bạn có thể tiếp tục chơi sau",
        className: "bg-sky-600 border-none text-white"
      });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể lưu game", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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
        setMistakes(state.mistakes || 0);
        setScore(session.current_score || 1000);

        const savedTimeLeft = state.timeLeft || (state.totalGameTime - session.elapsed_time) || 300;
        setTimeLeft(savedTimeLeft);
        setTotalGameTime(state.totalGameTime || savedTimeLeft);
        setElapsedTime(session.elapsed_time || 0);

        setGameStarted(true);
        setGameEnded(false);
        setGameWon(false);

        toast({
          title: "📥 Đã load game!",
          description: `Điểm: ${session.current_score} | Thời gian còn: ${Math.floor(savedTimeLeft / 60)}:${String(savedTimeLeft % 60).padStart(2, '0')}`,
          className: "bg-teal-600 border-none text-white"
        });
      }
    } catch (error) {
      toast({ title: "Thông báo", description: "Không tìm thấy game đã lưu", variant: "default" });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const startGame = (timeIndex) => {
    const times = config.times || [5, 10, 20];
    setSelectedTimeOption(timeIndex);
    const gameTime = times[timeIndex] * 60;
    setTimeLeft(gameTime);
    setTotalGameTime(gameTime);
    setElapsedTime(0);
    initGame();
    setGameStarted(true);
    setGameEnded(false);
  };

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      <span className="text-slate-400 font-mono animate-pulse">LOADING_DRAWING_GAME...</span>
    </div>
  );

  const times = config.times || [5, 10, 20];
  const progress = pattern.length > 0 ? Math.round((filledCells.size / pattern.length) * 100) : 0;

  if (!gameStarted && !gameEnded) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-3">
            <Palette className="w-10 h-10 text-emerald-400" />
            DRAWING GAME
          </h2>
          <p className="text-slate-400 text-sm">Click vào ô mờ để tô theo hình mẫu</p>
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


        <Button onClick={handleLoad} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 rounded-xl" disabled={isLoadingSession}>
          {isLoadingSession ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Tiếp tục game đã lưu
        </Button>

        <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
                Hướng dẫn chơi Drawing
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-slate-300 mt-4">
                  {GAME_INSTRUCTIONS.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3">
                      <h4 className="text-white font-bold text-sm uppercase mb-1">
                        {idx + 1}. {item.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-400">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-500">Đã hiểu</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Lưu game trước khi thoát?</AlertDialogTitle>
              <AlertDialogDescription>Bạn có muốn lưu tiến trình game hiện tại không?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleExitWithoutSave} className="bg-slate-800 text-white hover:bg-slate-700">Không lưu</AlertDialogCancel>
              <AlertDialogAction onClick={handleExitWithSave} className="bg-emerald-600 hover:bg-emerald-500">Lưu và thoát</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full px-4 overflow-y-auto py-6">
        <div className="flex flex-col items-center gap-8 w-full max-w-lg">
          <div className={cn(
            "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
            gameWon ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
          )}>
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center", gameWon ? "bg-emerald-500/20" : "bg-rose-500/20")}>
              {gameWon ? <Trophy className="w-12 h-12 text-emerald-400" /> : <Frown className="w-12 h-12 text-rose-400" />}
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-black text-white mb-2">{gameWon ? "HOÀN THÀNH!" : "HẾT GIỜ!"}</h2>
              <p className="text-slate-400">Tiến độ: {progress}% | Lỗi: {mistakes}</p>
            </div>
            <div className="bg-slate-950/50 px-8 py-4 rounded-2xl text-center">
              <span className="text-slate-400 text-sm">TỔNG ĐIỂM</span>
              <p className="text-5xl font-black text-white">{score}</p>
            </div>
            <Button onClick={() => { setGameStarted(false); setGameEnded(false); }} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-12 py-6 rounded-2xl text-lg">
              CHƠI LẠI
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full px-4 py-4 overflow-y-auto">
      <div className="flex flex-col items-center gap-3 w-full max-w-4xl">

        <div className="grid grid-cols-4 w-full max-w-2xl gap-2 flex-shrink-0">
          <StatBox label="ĐIỂM" value={score} color="text-emerald-400" icon={<Target className="w-3 h-3" />} />
          <StatBox label="TIẾN ĐỘ" value={`${progress}%`} color="text-violet-400" icon={<Sparkles className="w-3 h-3" />} />
          <StatBox label="LỖI" value={mistakes} color="text-rose-400" icon={<Palette className="w-3 h-3" />} />
          <StatBox label="THỜI GIAN" value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`} color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"} icon={<Clock className="w-3 h-3" />} />
        </div>

        <div className="w-full max-w-2xl h-2 bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>



        <div className="relative flex-shrink-0">
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
          <div
            className="relative grid gap-1 bg-slate-950 p-3 rounded-2xl shadow-2xl border-4 border-slate-700"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: 'min(80vw, 50vh, 600px)', aspectRatio: '1/1' }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const isPattern = pattern.includes(i);
            const isFilled = filledCells.has(i);
            const isWrong = wrongCells.has(i);
            const isHinted = hintedCells.includes(i);

            return (
              <div
                key={i}
                onClick={() => handleCellClick(i)}
                className={cn(
                  "rounded-sm transition-all duration-150 cursor-pointer relative",
                  isFilled && CELL_COLORS.filled,
                  isWrong && CELL_COLORS.wrong,
                  isHinted && CELL_COLORS.hinted,
                  !isFilled && !isWrong && isPattern && CELL_COLORS.pattern,
                  !isFilled && !isWrong && !isPattern && CELL_COLORS.empty
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Save Game Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !gameStarted || gameEnded}
        className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 transition-all flex-shrink-0"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {isSaving ? "Đang lưu..." : "Lưu Game"}
      </Button>

    </div>

    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Tạm dừng game</AlertDialogTitle>
            <AlertDialogDescription>Bạn muốn làm gì tiếp theo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelExit} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Tiếp tục chơi
            </Button>
            <AlertDialogCancel onClick={handleExitGameWithoutSave} className="bg-slate-800 text-white hover:bg-slate-700">
              Thoát không lưu
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExitGameWithSave} className="bg-emerald-600 hover:bg-emerald-500">
              Lưu & thoát
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-center min-h-[60px]">
      <div className={cn("flex items-center gap-1 mb-0.5", color)}>
        {icon}
        <span className="text-[8px] font-black tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-mono font-black", color)}>{value}</span>
    </div>
  );
}