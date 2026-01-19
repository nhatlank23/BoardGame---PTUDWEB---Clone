import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Circle,
  Loader2,
  Clock,
  Trophy,
  Frown,
  Target,
  Zap,
  User,
  Cpu,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  ArrowLeft,
  Lightbulb,
  HelpCircle,
  Save,
} from "lucide-react";
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

const GAME_INSTRUCTIONS = [
  {
    title: "Luật chơi Caro",
    content:
      "Sử dụng quân X để đối đầu với máy (quân O). Bạn thắng khi xếp được đúng 5 quân X liên tiếp theo hàng ngang, dọc hoặc chéo mà không bị chặn hai đầu.",
  },
  {
    title: "Cách thức điều khiển",
    content: "Sử dụng cụm 5 phím bấm: Dùng phím TRÁI/PHẢI để di chuyển con trỏ trên bảng LED 10x10. Nhấn phím ENTER để xác nhận đặt quân tại vị trí đã chọn.",
  },
  {
    title: "Lượt chơi & Đối thủ",
    content: "Bạn luôn là người đi trước. Sau khi bạn nhấn ENTER, AI sẽ tự động tính toán và phản đòn bằng quân O trong vòng chưa đầy 1 giây.",
  },
  {
    title: "Thời gian & Áp lực",
    content: "Mỗi lượt chơi có tổng thời gian giới hạn. Thanh thời gian (hoặc LED đếm ngược) sẽ chạy liên tục, đòi hỏi bạn phải quyết định thật nhanh.",
  },
  {
    title: "Hệ thống tính điểm",
    content: "Thắng ván: +100 điểm. Thắng nhanh: Nhận thêm 'Bonus Time' dựa trên số giây còn lại. Hòa: Không cộng điểm.",
  },
  {
    title: "Quyền trợ giúp (Hint)",
    content: "Khi gặp thế cờ khó, hãy nhấn phím HINT. Ô cờ tối ưu nhất để phòng thủ hoặc tấn công sẽ NHẤP NHÁY trên bảng LED để chỉ dẫn cho bạn.",
  },
  {
    title: "Kết thúc & Chơi lại",
    content: "Khi một bên thắng hoặc đầy bảng (Hòa), nhấn phím BACK để quay lại Menu chính hoặc hệ thống sẽ tự động Reset để bắt đầu ván mới sau 3 giây.",
  },
];

const CELL_COLORS = {
  empty: "bg-card hover:bg-secondary/5",
  playerX: "bg-red-500/20 border-red-500",
  cpuO: "bg-blue-500/20 border-blue-500",
  hinted: "ring-2 ring-amber-400 animate-pulse",
};

export default function CaroGame({ winCount = 5 }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ rows: 12, cols: 12, winCount: winCount, times: [5, 10, 20] });
  const [gameId, setGameId] = useState(null);

  const [board, setBoard] = useState([]);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [hintCell, setHintCell] = useState(null);

  const [selectedTimeOption, setSelectedTimeOption] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [totalGameTime, setTotalGameTime] = useState(300);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [playerMoves, setPlayerMoves] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const timerRef = useRef();
  const elapsedRef = useRef();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const shouldBlock = gameStarted && !gameEnded && !winner && !isNavigatingRef.current;

    const handleClick = (e) => {
      if (!shouldBlock) return;

      const target = e.target.closest("a[href]");
      if (target && target.getAttribute("href") !== window.location.pathname) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavigation(target.getAttribute("href"));
        setShowNavigationDialog(true);
      }
    };

    if (shouldBlock) {
      document.addEventListener("click", handleClick, true);
    }

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [gameStarted, gameEnded, winner]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const slug = winCount === 4 ? "caro-4" : "caro-5";
        const response = await gameService.getGameBySlug(slug);

        if (response.status === "success") {
          const apiConfig = response.data.config;
          setConfig({
            rows: apiConfig.rows || 12,
            cols: apiConfig.cols || 12,
            winCount: apiConfig.winCount || winCount,
            times: apiConfig.times || [5, 10, 20],
          });
          setGameId(response.data.id);
          const times = apiConfig.times || [5, 10, 20];
          setTimeLeft(times[0] * 60);
          setTotalGameTime(times[0] * 60);
        }
      } catch (error) {
        toast({ title: "Note", description: "Using default Caro config", className: "bg-card text-muted-foreground" });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [toast, winCount]);

  const initBoard = useCallback(() => {
    setBoard(Array(config.rows * config.cols).fill(null));
    setWinner(null);
    setIsXNext(true);
    setPlayerMoves(0);
    setRoundScore(0);
    setHintCell(null);
  }, [config]);

  const checkWin = useCallback(
    (currentBoard, idx, player) => {
      const ROWS = config.rows;
      const COLS = config.cols;
      const r = Math.floor(idx / COLS);
      const c = idx % COLS;

      const count = (dr, dc) => {
        let cnt = 0;
        let i = 1;
        while (true) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (currentBoard[nr * COLS + nc] === player) cnt++;
          else break;
          i++;
        }
        return cnt;
      };

      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];
      for (const [dr, dc] of directions) {
        if (count(dr, dc) + count(-dr, -dc) + 1 >= config.winCount) return true;
      }
      return false;
    },
    [config]
  );

  // Thắng: +1, Thua: -1, Hòa: 0
  const calculateRoundScore = useCallback((result) => {
    let score = 0;
    let breakdown = [];

    if (result === "X") {
      score = 1;
      breakdown.push("+1 (Thắng)");
    } else if (result === "Draw" || result === "TimeUp") {
      score = 0;
      breakdown.push("0 (Hòa)");
    } else {
      // O wins = player loses
      score = -1;
      breakdown.push("-1 (Thua)");
    }

    return { score, breakdown };
  }, []);

  // --- SAVE ROUND RESULT ---
  // Lưu kết quả mỗi ván ngay khi kết thúc
  const saveRoundResult = useCallback(
    async (score) => {
      if (!gameId) return;
      try {
        await gameService.savePlayHistory({
          game_id: gameId,
          score: score, // -1, 0, or 1
          duration: elapsedTime,
        });
      } catch (error) {
        console.error("Failed to save round result:", error);
      }
    },
    [gameId, elapsedTime]
  );

  const findBestMove = useCallback(() => {
    const emptyIndices = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
    if (emptyIndices.length === 0) return null;

    const centerRow = Math.floor(config.rows / 2);
    const centerCol = Math.floor(config.cols / 2);
    const centerIdx = centerRow * config.cols + centerCol;

    if (board[centerIdx] === null) return centerIdx;

    const nearby = emptyIndices.filter((idx) => {
      const r = Math.floor(idx / config.cols);
      const c = idx % config.cols;
      return Math.abs(r - centerRow) <= 3 && Math.abs(c - centerCol) <= 3;
    });

    return nearby.length > 0 ? nearby[0] : emptyIndices[0];
  }, [board, config]);

  const handleCellClick = useCallback(
    (idx) => {
      if (winner || board[idx] || !gameStarted || gameEnded || !isXNext) return;

      setHintCell(null);

      const newBoard = [...board];
      newBoard[idx] = "X";
      setBoard(newBoard);
      setPlayerMoves((prev) => prev + 1);

      if (checkWin(newBoard, idx, "X")) {
        setWinner("X");
        const { score, breakdown } = calculateRoundScore("X");
        setRoundScore(score);
        setTotalScore((prev) => prev + score);
        setRoundsPlayed((prev) => prev + 1);
        // Lưu kết quả ván ngay
        saveRoundResult(score);

        toast({
          title: "🎉 Bạn Thắng!",
          description: breakdown.join(" | "),
          className: "bg-emerald-600 border-none text-white",
        });
      } else if (!newBoard.includes(null)) {
        setWinner("Draw");
        const { score, breakdown } = calculateRoundScore("Draw");
        setRoundScore(score);
        setTotalScore((prev) => prev + score);
        setRoundsPlayed((prev) => prev + 1);
        // Lưu kết quả ván ngay
        saveRoundResult(score);

        toast({
          title: "🤝 Hòa!",
          description: breakdown.join(" | "),
          className: "bg-amber-600 border-none text-white",
        });
      } else {
        setIsXNext(false);
      }
    },
    [board, isXNext, winner, gameStarted, gameEnded, checkWin, calculateRoundScore, saveRoundResult, toast]
  );

  useEffect(() => {
    if (!isXNext && !winner && gameStarted && !gameEnded && !loading) {
      const timer = setTimeout(() => {
        const emptyIndices = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
        if (emptyIndices.length > 0) {
          const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

          const newBoard = [...board];
          newBoard[randomMove] = "O";
          setBoard(newBoard);

          if (checkWin(newBoard, randomMove, "O")) {
            setWinner("O");
            const { score, breakdown } = calculateRoundScore("O");
            setRoundScore(score);
            setTotalScore((prev) => prev + score);
            setRoundsPlayed((prev) => prev + 1);
            // Lưu kết quả ván ngay
            saveRoundResult(score);

            toast({
              title: "💻 Máy Thắng!",
              description: breakdown.join(" | "),
              className: "bg-rose-600 border-none text-white",
            });
          } else if (!newBoard.includes(null)) {
            setWinner("Draw");
            const { score, breakdown } = calculateRoundScore("Draw");
            setRoundScore(score);
            setTotalScore((prev) => prev + score);
            setRoundsPlayed((prev) => prev + 1);
            // Lưu kết quả ván ngay
            saveRoundResult(score);

            toast({
              title: "🤝 Hòa!",
              description: breakdown.join(" | "),
              className: "bg-amber-600 border-none text-white",
            });
          } else {
            setIsXNext(true);
          }
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, board, loading, gameStarted, gameEnded, checkWin, calculateRoundScore, saveRoundResult, toast]);

  useEffect(() => {
    if (!gameStarted || gameEnded || winner) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(elapsedRef.current);
          // Hết giờ = Hòa, lưu kết quả và cho phép chơi lại
          setWinner("TimeUp");
          const { score, breakdown } = calculateRoundScore("TimeUp");
          setRoundScore(score);
          setTotalScore((prevScore) => prevScore + score);
          setRoundsPlayed((prev) => prev + 1);
          // Lưu kết quả ván (score = 0)
          saveRoundResult(score);
          // Không setGameEnded - cho phép chơi lại
          toast({
            title: "⏰ Hết giờ!",
            description: "Ván đấu kết thúc hòa. " + breakdown.join(" | "),
            className: "bg-amber-600 border-none text-white",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    elapsedRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
    };
  }, [gameStarted, gameEnded, winner, calculateRoundScore, saveRoundResult, toast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      const times = config.times || [5, 10, 20];

      if (!gameStarted) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            setSelectedTimeOption((prev) => Math.max(0, prev - 1));
            break;
          case "ArrowRight":
            e.preventDefault();
            setSelectedTimeOption((prev) => Math.min(times.length - 1, prev + 1));
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

      if (!gameEnded && !winner) {
        switch (e.key) {
          case "h":
          case "H":
            e.preventDefault();
            // Show hint inline
            if (isXNext && !winner) {
              const emptyIndices = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
              if (emptyIndices.length > 0) {
                const centerRow = Math.floor(config.rows / 2);
                const centerCol = Math.floor(config.cols / 2);
                const centerIdx = centerRow * config.cols + centerCol;
                let suggestion = null;
                if (board[centerIdx] === null) suggestion = centerIdx;
                else {
                  const nearby = emptyIndices.filter((idx) => {
                    const r = Math.floor(idx / config.cols);
                    const c = idx % config.cols;
                    return Math.abs(r - centerRow) <= 3 && Math.abs(c - centerCol) <= 3;
                  });
                  suggestion = nearby.length > 0 ? nearby[0] : emptyIndices[0];
                }
                if (suggestion !== null) {
                  setHintCell(suggestion);
                  setTimeout(() => setHintCell(null), 3000);
                }
              }
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
  }, [loading, gameStarted, gameEnded, winner, selectedTimeOption, config, navigate, isXNext, board]);

  const handleBackFromConfig = () => {
    if (totalScore > 0) {
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
    if (!gameStarted) setSelectedTimeOption((prev) => Math.max(0, prev - 1));
  };

  const handleRight = () => {
    if (!gameStarted) {
      const times = config.times || [5, 10, 20];
      setSelectedTimeOption((prev) => Math.min(times.length - 1, prev + 1));
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
    if (gameStarted && !gameEnded && !winner) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameEnded(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      elapsedRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleHint = () => {
    if (!gameStarted) {
      setShowInstructions(true);
      return;
    }

    if (!isXNext || winner || gameEnded) return;

    const suggestion = findBestMove();
    if (suggestion !== null) {
      setHintCell(suggestion);

      const row = Math.floor(suggestion / config.cols) + 1;
      const col = (suggestion % config.cols) + 1;

      toast({
        title: "💡 Gợi ý",
        description: `Ô (${row}, ${col}) đang nhấp nháy`,
        className: "bg-yellow-600 border-none text-white",
      });

      setTimeout(() => setHintCell(null), 3000);
    }
  };

  const handleNewRound = () => {
    initBoard();
  };

  const handleSave = async () => {
    if (!gameId) return;
    setIsSaving(true);
    try {
      await gameService.saveGameSession({
        game_id: gameId,
        matrix_state: JSON.stringify({
          board,
          isXNext,
          playerMoves,
          roundsPlayed,
          timeLeft,
          totalGameTime,
        }),
        current_score: totalScore,
        elapsed_time: elapsedTime,
      });
      toast({
        title: "💾 Đã lưu game!",
        description: "Bạn có thể tiếp tục chơi sau",
        className: "bg-sky-600 border-none text-white",
      });
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể lưu game", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation handlers
  const handleNavigationWithSave = async () => {
    try {
      await handleSave();
      isNavigatingRef.current = true;
      setShowNavigationDialog(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi khi lưu trò chơi",
        description: error.message,
      });
    }
  };

  const handleNavigationWithoutSave = () => {
    isNavigatingRef.current = true;
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationDialog(false);
    setPendingNavigation(null);
  };

  const handleLoad = async () => {
    if (!gameId) return;
    setIsLoadingSession(true);
    try {
      const response = await gameService.getLastSession(gameId);
      if (response.status === "success" && response.data) {
        const session = response.data;
        const state = JSON.parse(session.matrix_state);
        setBoard(state.board);
        setIsXNext(state.isXNext);
        setPlayerMoves(state.playerMoves || 0);
        setRoundsPlayed(state.roundsPlayed || 0);
        setTotalScore(session.current_score || 0);

        const savedTimeLeft = state.timeLeft || state.totalGameTime - session.elapsed_time || 300;
        setTimeLeft(savedTimeLeft);
        setTotalGameTime(state.totalGameTime || savedTimeLeft);
        setElapsedTime(session.elapsed_time || 0);

        setGameStarted(true);
        setWinner(null);

        toast({
          title: "📥 Đã load game!",
          description: `Điểm: ${session.current_score} | Thời gian còn: ${Math.floor(savedTimeLeft / 60)}:${String(savedTimeLeft % 60).padStart(2, "0")}`,
          className: "bg-teal-600 border-none text-white",
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
    setTotalScore(0);
    setRoundsPlayed(0);
    setPlayerMoves(0);
    initBoard();
    setGameStarted(true);
    setGameEnded(false);
  };

  if (loading)
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
        <span className="text-slate-400 font-mono animate-pulse">LOADING_CARO_GAME...</span>
      </div>
    );

  const times = config.times || [5, 10, 20];

  if (!gameStarted && !gameEnded) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">CARO {config.winCount} HÀNG</h2>
          <p className="text-muted-foreground text-xs mt-1">
            Bàn: {config.cols}x{config.rows}
          </p>
        </div>

        <div className="flex gap-4">
          {times.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTimeOption(idx)}
              className={cn(
                "px-8 py-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
                selectedTimeOption === idx
                  ? "bg-blue-500/20 border-blue-500 scale-110 shadow-lg shadow-blue-500/30"
                  : "bg-card border-border hover:border-muted-foreground"
              )}
            >
              <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-blue-400" : "text-muted-foreground")} />
              <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-blue-400" : "text-foreground")}>{t} phút</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleLoad}
          variant="outline"
          className="border-border text-muted-foreground hover:bg-card px-8 py-4 rounded-xl"
          disabled={isLoadingSession}
        >
          {isLoadingSession ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Tiếp tục game đã lưu
        </Button>

        <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
                Hướng dẫn chơi Caro
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-muted-foreground mt-4">
                  {GAME_INSTRUCTIONS.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3">
                      <h4 className="text-foreground font-bold text-sm uppercase mb-1">
                        {idx + 1}. {item.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.content}</p>
                    </div>
                  ))}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-blue-600 hover:bg-blue-500">Đã hiểu</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Lưu game trước khi thoát?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">Bạn có muốn lưu tiến trình game hiện tại không?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleExitWithoutSave} className="bg-secondary text-foreground hover:bg-secondary/80">
                Không lưu
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleExitWithSave} className="bg-emerald-600 hover:bg-emerald-500">
                Lưu và thoát
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <div
          className={cn(
            "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
            totalScore > 0 ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
          )}
        >
          <div className={cn("w-24 h-24 rounded-full flex items-center justify-center", totalScore > 0 ? "bg-emerald-500/20" : "bg-rose-500/20")}>
            {totalScore > 0 ? <Trophy className="w-12 h-12 text-emerald-400" /> : <Frown className="w-12 h-12 text-rose-400" />}
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-foreground mb-2">HẾT GIỜ!</h2>
            <p className="text-muted-foreground">Bạn đã chơi {roundsPlayed} ván</p>
          </div>
          <div className="bg-card border border-border px-8 py-4 rounded-2xl">
            <span className="text-muted-foreground text-sm">TỔNG ĐIỂM</span>
            <p className="text-5xl font-black text-foreground">{totalScore}</p>
          </div>
          <Button
            onClick={() => {
              setGameStarted(false);
              setGameEnded(false);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
          >
            CHƠI LẠI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-5xl h-full px-4 py-2 justify-center">
      <div className="grid grid-cols-4 w-full max-w-2xl gap-3">
        <StatBox label="ĐIỂM" value={totalScore} color="text-emerald-400" icon={<Target className="w-4 h-4" />} />
        <StatBox label="VÁN" value={roundsPlayed} color="text-violet-400" icon={<Zap className="w-4 h-4" />} />
        <StatBox
          label="THỜI GIAN"
          value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
          color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
          icon={<Clock className="w-4 h-4" />}
        />
        <div className="bg-card border border-border p-2 rounded-xl flex items-center justify-center">
          <div className={cn("flex items-center gap-2", isXNext ? "text-red-400" : "text-blue-400")}>
            {isXNext ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
            <span className="font-bold text-sm">{isXNext ? "Lượt bạn" : "Lượt máy"}</span>
            {!isXNext && !winner && <Loader2 className="w-3 h-3 animate-spin" />}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-2xl" />
        <div
          className={cn(
            "relative grid gap-[2px] bg-card p-3 rounded-2xl shadow-2xl border-4 border-border transition-all",
            !isXNext && !winner && "opacity-80"
          )}
          style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`, width: "min(95vw, 65vh)", aspectRatio: `${config.cols}/${config.rows}` }}
        >
          {board.map((cell, i) => (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              className={cn(
                "flex items-center justify-center rounded transition-all duration-200 cursor-pointer aspect-square border",
                cell === null && isXNext && !winner ? "bg-secondary hover:bg-secondary/80 border-border" : "border-transparent",
                cell === "X" && CELL_COLORS.playerX,
                cell === "O" && CELL_COLORS.cpuO,
                hintCell === i && CELL_COLORS.hinted,
                (!isXNext || winner) && cell === null && "opacity-70 cursor-not-allowed"
              )}
            >
              {cell === "X" && <X className="w-2/3 h-2/3 text-red-500" strokeWidth={3} />}
              {cell === "O" && <Circle className="w-2/3 h-2/3 text-blue-500" strokeWidth={3.5} />}
            </div>
          ))}

          {winner && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20 animate-in fade-in zoom-in">
              <div
                className={cn(
                  "p-6 rounded-2xl flex flex-col items-center gap-4",
                  winner === "X"
                    ? "bg-emerald-500/20 border border-emerald-500"
                    : winner === "Draw"
                    ? "bg-amber-500/20 border border-amber-500"
                    : "bg-rose-500/20 border border-rose-500"
                )}
              >
                <span className="text-5xl">{winner === "X" ? "🎉" : winner === "Draw" ? "🤝" : "💻"}</span>
                <h3 className="text-2xl font-black text-foreground">{winner === "X" ? "BẠN THẮNG!" : winner === "Draw" ? "HÒA!" : "MÁY THẮNG!"}</h3>
                <div className="text-3xl font-black text-emerald-400">+{roundScore}</div>
                <Button onClick={handleNewRound} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-xl">
                  VÁN TIẾP THEO
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Game Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !gameStarted || gameEnded}
        className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isSaving ? "Đang lưu..." : "Lưu Game"}
      </Button>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Tạm dừng game</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Bạn muốn làm gì tiếp theo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelExit} variant="outline" className="border-border text-foreground hover:bg-secondary">
              Tiếp tục chơi
            </Button>
            <AlertDialogCancel onClick={handleExitGameWithoutSave} className="bg-secondary text-foreground hover:bg-secondary/80">
              Thoát không lưu
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExitGameWithSave} className="bg-emerald-600 hover:bg-emerald-500">
              Lưu & thoát
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Navigation Guard Dialog */}
      <AlertDialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Bạn đang có trận đấu dở</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Bạn có muốn lưu trận đấu hiện tại trước khi rời đi không?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelNavigation} variant="outline" className="border-border text-foreground hover:bg-secondary">
              Ở lại tiếp tục
            </Button>
            <AlertDialogCancel onClick={handleNavigationWithoutSave} className="bg-secondary text-foreground hover:bg-secondary/80">
              Rới đi không lưu
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleNavigationWithSave} className="bg-emerald-600 hover:bg-emerald-500">
              Lưu và rời đi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <div className="bg-card border border-border p-3 rounded-xl backdrop-blur-md flex flex-col items-center justify-center">
      <div className={cn("flex items-center gap-1 mb-1", color)}>
        {icon}
        <span className="text-[9px] font-black tracking-wider">{label}</span>
      </div>
      <span className={cn("text-lg font-mono font-black", color)}>{value}</span>
    </div>
  );
}
