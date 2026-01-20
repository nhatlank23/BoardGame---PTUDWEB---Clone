import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Brain,
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

const ALL_ICONS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐙", "🦄", "🦋", "🌸"];

const GAME_INSTRUCTIONS = [
  {
    title: "Thể lệ đối kháng",
    content:
      "Bạn và Máy (AI) sẽ luân phiên nhau lật các thẻ bài trên bàn. Mục tiêu là tìm được nhiều cặp thẻ trùng khớp hơn đối thủ trước khi toàn bộ bàn cờ được lật hết.",
  },
  {
    title: "Thao tác lật thẻ",
    content: "Sử dụng CHUỘT trái để lật thẻ. Trong mỗi lượt, bạn được lật tối đa 2 thẻ. Hãy ghi nhớ vị trí và hình ảnh (icon) của chúng.",
  },
  {
    title: "Quy tắc khớp thẻ",
    content: "Nếu 2 thẻ trùng icon: Bạn nhận +100 điểm, cặp thẻ đó sẽ luôn mở và bạn được TIẾP TỤC lật thêm một lượt nữa.",
  },
  {
    title: "Lượt của đối thủ (AI)",
    content: "Nếu 2 thẻ không trùng: Thẻ sẽ úp lại sau 1 giây và lượt chơi chuyển sang Máy. Hãy chú ý các thẻ Máy lật để ghi nhớ vị trí cho lượt sau của mình.",
  },
  {
    title: "Quyền trợ giúp (Hint)",
    content: "Nhấn nút HINT để nhờ AI tìm giúp 1 cặp thẻ trùng nhau. Hai thẻ này sẽ nhấp nháy trong 2 giây. Tuy nhiên, bạn sẽ bị trừ 50 điểm phí trợ giúp.",
  },
  {
    title: "Điều kiện chiến thắng",
    content: "Trò chơi kết thúc khi không còn thẻ úp. Bạn thắng nếu tổng số cặp thẻ lật được nhiều hơn Máy. Kết thúc nhanh sẽ nhận thêm Bonus thời gian!",
  },
];
const CELL_COLORS = {
  hidden: "bg-secondary border-border hover:bg-secondary/80",
  flipped: "bg-indigo-600 border-indigo-400",
  matched: "bg-emerald-600/40 border-emerald-500",
  hinted: "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse",
};

export default function MemoryGame({ setControllerConfig }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [gameId, setGameId] = useState(null);

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [seenCards, setSeenCards] = useState(new Set());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const [selectedTimeOption, setSelectedTimeOption] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [totalGameTime, setTotalGameTime] = useState(300);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [playerPairs, setPlayerPairs] = useState(0);
  const [computerPairs, setComputerPairs] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [hintIndices, setHintIndices] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const timerRef = useRef();
  const elapsedRef = useRef();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (setControllerConfig) {
      setControllerConfig({ disableLeft: gameStarted, disableRight: gameStarted });
    }
  }, [gameStarted, setControllerConfig]);

  useEffect(() => {
    const shouldBlock = gameStarted && !gameEnded && matchedIndices.length < cards.length && !isNavigatingRef.current;

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
  }, [gameStarted, gameEnded, matchedIndices.length, cards.length]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await gameService.getGameBySlug("memory");
        if (response.status === "success") {
          setConfig(response.data.config);
          setGameId(response.data.id);
          const times = response.data.config?.times || [5, 10, 20];
          setTimeLeft(times[0] * 60);
          setTotalGameTime(times[0] * 60);
        }
      } catch (error) {
        toast({ title: "Lỗi", description: "Không tải được cấu hình game", variant: "destructive" });
        setConfig({ times: [5, 10, 20], rows: 4, cols: 4 });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [toast]);

  const initGame = useCallback(() => {
    const rows = config?.rows || 4;
    const cols = config?.cols || 4;
    const totalCells = rows * cols;
    const pairsCount = Math.floor(totalCells / 2);
    const selectedIcons = ALL_ICONS.slice(0, pairsCount);
    const pairs = [...selectedIcons, ...selectedIcons];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    setCards(pairs);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setSeenCards(new Set());
    setIsChecking(false);
    setIsPlayerTurn(true);
    setPlayerPairs(0);
    setComputerPairs(0);
    setComboCount(0);
    setHintIndices([]);
    setPlayerScore(0);
  }, [config]);

  const calculateFinalScore = useCallback(() => {
    let score = 0;
    let breakdown = [];

    const pairScore = playerPairs * 100;
    score += pairScore;
    breakdown.push(`+${pairScore} (${playerPairs} cặp)`);

    if (playerPairs > computerPairs) {
      score += 500;
      breakdown.push("+500 (Thắng)");
    } else if (playerPairs === computerPairs) {
      breakdown.push("+0 (Hòa)");
    } else {
      breakdown.push("+0 (Thua)");
    }

    const timePenalty = Math.floor(elapsedTime / 10);
    score -= timePenalty;
    breakdown.push(`-${timePenalty} (Thời gian)`);

    return { score: Math.max(0, score), breakdown };
  }, [playerPairs, computerPairs, elapsedTime]);

  const handleCardClick = useCallback(
    (idx) => {
      if (!gameStarted || gameEnded || isChecking || !isPlayerTurn) return;
      if (flippedIndices.includes(idx) || matchedIndices.includes(idx)) return;

      setHintIndices([]);

      if (seenCards.has(idx) && !matchedIndices.includes(idx)) {
        setPlayerScore((prev) => Math.max(0, prev - 10));
        toast({
          title: "-10 điểm",
          description: "Bạn đã lật ô này trước đó!",
          className: "bg-rose-600 border-none text-white",
        });
      }

      setSeenCards((prev) => new Set([...prev, idx]));
      setFlippedIndices((prev) => [...prev, idx]);
    },
    [gameStarted, gameEnded, isChecking, isPlayerTurn, flippedIndices, matchedIndices, seenCards, toast]
  );

  useEffect(() => {
    if (flippedIndices.length !== 2) return;

    setIsChecking(true);
    const [first, second] = flippedIndices;

    const timer = setTimeout(() => {
      if (cards[first] === cards[second]) {
        setMatchedIndices((prev) => [...prev, first, second]);

        if (isPlayerTurn) {
          const baseScore = 100;
          const comboBonus = comboCount * 50;
          const totalPoints = baseScore + comboBonus;

          setPlayerScore((prev) => prev + totalPoints);
          setPlayerPairs((prev) => prev + 1);
          setComboCount((prev) => prev + 1);

          toast({
            title: `+${totalPoints} điểm!`,
            description: comboBonus > 0 ? `Combo x${comboCount + 1}!` : "Tìm được cặp!",
            className: "bg-emerald-600 border-none text-white",
          });
        } else {
          setComputerPairs((prev) => prev + 1);
          toast({
            title: "Máy tìm được cặp!",
            description: `Máy: ${computerPairs + 1} cặp`,
            className: "bg-blue-600 border-none text-white",
          });
        }

        setFlippedIndices([]);
        setIsChecking(false);
      } else {
        if (isPlayerTurn) setComboCount(0);

        setTimeout(() => {
          setFlippedIndices([]);
          setIsChecking(false);
          setIsPlayerTurn((prev) => !prev);
        }, 500);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [flippedIndices, cards, isPlayerTurn, comboCount, computerPairs, toast]);

  useEffect(() => {
    if (!isPlayerTurn && gameStarted && !gameEnded && !isChecking && matchedIndices.length < cards.length) {
      const timer = setTimeout(() => {
        const available = cards.map((_, i) => i).filter((i) => !matchedIndices.includes(i) && !flippedIndices.includes(i));

        if (available.length >= 2) {
          const shuffled = [...available].sort(() => Math.random() - 0.5);
          const [first, second] = shuffled.slice(0, 2);

          setSeenCards((prev) => new Set([...prev, first]));
          setFlippedIndices([first]);

          setTimeout(() => {
            setSeenCards((prev) => new Set([...prev, second]));
            setFlippedIndices([first, second]);
          }, 600);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameStarted, gameEnded, isChecking, matchedIndices, cards, flippedIndices]);

  useEffect(() => {
    if (gameStarted && cards.length > 0 && matchedIndices.length === cards.length) {
      setGameEnded(true);
    }
  }, [gameStarted, matchedIndices, cards]);

  useEffect(() => {
    if (!gameStarted || gameEnded) return;

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

    return () => {
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
    };
  }, [gameStarted, gameEnded]);

  useEffect(() => {
    const saveHistory = async () => {
      if (gameEnded && gameId) {
        const { score } = calculateFinalScore();
        try {
          await gameService.savePlayHistory({
            game_id: gameId,
            score: score,
            duration: elapsedTime,
          });
        } catch (error) {
          console.error("Failed to save history:", error);
        }
      }
    };
    saveHistory();
  }, [gameEnded, gameId, elapsedTime, calculateFinalScore]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      const times = config?.times || [5, 10, 20];

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

      if (!gameEnded) {
        switch (e.key) {
          case "h":
          case "H":
            e.preventDefault();
            // Hint inline - find matching pair
            if (isPlayerTurn && !isChecking) {
              const unmatched = cards.map((icon, i) => ({ icon, i })).filter(({ i }) => !matchedIndices.includes(i));
              const iconGroups = {};
              unmatched.forEach(({ icon, i }) => {
                if (!iconGroups[icon]) iconGroups[icon] = [];
                iconGroups[icon].push(i);
              });
              const pair = Object.values(iconGroups).find((arr) => arr.length >= 2);
              if (pair) {
                setHintIndices(pair.slice(0, 2));
                setPlayerScore((prev) => Math.max(0, prev - 50));
                setTimeout(() => setHintIndices([]), 3000);
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
  }, [loading, gameStarted, gameEnded, selectedTimeOption, config, navigate, isPlayerTurn, isChecking, cards, matchedIndices]);

  const handleBackFromConfig = () => {
    if (playerScore > 0) {
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
      const times = config?.times || [5, 10, 20];
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
    if (gameStarted && !gameEnded) {
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

  const handleHint = () => {
    if (!gameStarted) {
      setShowInstructions(true);
      return;
    }

    if (!isPlayerTurn || isChecking || gameEnded) return;

    const unmatched = cards.map((icon, i) => ({ icon, i })).filter(({ i }) => !matchedIndices.includes(i));

    const iconGroups = {};
    unmatched.forEach(({ icon, i }) => {
      if (!iconGroups[icon]) iconGroups[icon] = [];
      iconGroups[icon].push(i);
    });

    const pair = Object.values(iconGroups).find((arr) => arr.length >= 2);
    if (pair) {
      setHintIndices(pair.slice(0, 2));
      setPlayerScore((prev) => Math.max(0, prev - 50));

      toast({
        title: "💡 -50 điểm (Hint)",
        description: "Cặp trùng đang nhấp nháy!",
        className: "bg-amber-600 border-none text-white",
      });

      setTimeout(() => setHintIndices([]), 3000);
    }
  };

  const handleSave = async () => {
    if (!gameId) return;
    setIsSaving(true);
    try {
      await gameService.saveGameSession({
        game_id: gameId,
        matrix_state: JSON.stringify({
          cards,
          matchedIndices,
          playerPairs,
          computerPairs,
          isPlayerTurn,
          comboCount,
          seenCards: [...seenCards],
          timeLeft,
          totalGameTime,
        }),
        current_score: playerScore,
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

  const handleLoad = async () => {
    if (!gameId) return;
    setIsLoadingSession(true);
    try {
      const response = await gameService.getLastSession(gameId);
      if (response.status === "success" && response.data) {
        const session = response.data;
        const state = JSON.parse(session.matrix_state);

        setCards(state.cards);
        setMatchedIndices(state.matchedIndices || []);
        setPlayerPairs(state.playerPairs || 0);
        setComputerPairs(state.computerPairs || 0);
        setIsPlayerTurn(state.isPlayerTurn ?? true);
        setComboCount(state.comboCount || 0);
        setSeenCards(new Set(state.seenCards || []));
        setPlayerScore(session.current_score || 0);

        const savedTimeLeft = state.timeLeft || state.totalGameTime - session.elapsed_time || 300;
        setTimeLeft(savedTimeLeft);
        setTotalGameTime(state.totalGameTime || savedTimeLeft);
        setElapsedTime(session.elapsed_time || 0);

        setFlippedIndices([]);
        setGameStarted(true);
        setGameEnded(false);

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
    const times = config?.times || [5, 10, 20];
    setSelectedTimeOption(timeIndex);
    const gameTime = times[timeIndex] * 60;
    setTimeLeft(gameTime);
    setTotalGameTime(gameTime);
    setElapsedTime(0);
    initGame();
    setGameStarted(true);
    setGameEnded(false);
  };

  if (loading)
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 className="animate-spin text-purple-500 w-12 h-12" />
        <span className="text-muted-foreground font-mono animate-pulse">LOADING_MEMORY_GAME...</span>
      </div>
    );

  const times = config?.times || [5, 10, 20];

  if (!gameStarted && !gameEnded) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-purple-400" />
            MEMORY GAME
          </h2>
          <p className="text-muted-foreground text-sm">Click vào thẻ để lật và tìm cặp</p>
        </div>

        <div className="flex gap-4">
          {times.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTimeOption(idx)}
              className={cn(
                "px-8 py-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
                selectedTimeOption === idx
                  ? "bg-purple-500/20 border-purple-500 scale-110 shadow-lg shadow-purple-500/30"
                  : "bg-card border-border hover:border-border/50"
              )}
            >
              <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-purple-400" : "text-muted-foreground")} />
              <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-purple-400" : "text-muted-foreground")}>{t} phút</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleLoad}
          variant="outline"
          className="border-border text-muted-foreground hover:bg-secondary px-8 py-4 rounded-xl"
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
                Hướng dẫn chơi Memory
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
              <AlertDialogAction className="bg-purple-600 hover:bg-purple-500">Đã hiểu</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Lưu game trước khi thoát?</AlertDialogTitle>
              <AlertDialogDescription>Bạn có muốn lưu tiến trình game hiện tại không?</AlertDialogDescription>
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
    const { score, breakdown } = calculateFinalScore();
    const playerWon = playerPairs > computerPairs;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full px-4 overflow-y-auto py-6">
        <div className="flex flex-col items-center gap-8 w-full max-w-lg">
          <div
            className={cn(
              "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
              playerWon ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
            )}
          >
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center", playerWon ? "bg-emerald-500/20" : "bg-rose-500/20")}>
              {playerWon ? <Trophy className="w-12 h-12 text-emerald-400" /> : <Frown className="w-12 h-12 text-rose-400" />}
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-black text-foreground mb-2">{playerWon ? "BẠN THẮNG!" : playerPairs === computerPairs ? "HÒA!" : "MÁY THẮNG!"}</h2>
              <p className="text-muted-foreground">
                Bạn: {playerPairs} cặp | Máy: {computerPairs} cặp
              </p>
            </div>
            <div className="bg-background/50 px-8 py-4 rounded-2xl text-center">
              <span className="text-muted-foreground text-sm">TỔNG ĐIỂM</span>
              <p className="text-5xl font-black text-foreground">{score}</p>
              <div className="text-xs text-muted-foreground mt-2">{breakdown.join(" | ")}</div>
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
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full px-4 py-4 overflow-y-auto">
      <div className="flex flex-col items-center gap-3 w-full max-w-3xl">
        <div className="grid grid-cols-4 w-full gap-2 flex-shrink-0">
          <StatBox label="ĐIỂM" value={playerScore} color="text-emerald-400" icon={<Target className="w-3 h-3" />} />
          <StatBox label="BẠN" value={`${playerPairs} cặp`} color="text-purple-400" icon={<User className="w-3 h-3" />} />
          <StatBox label="MÁY" value={`${computerPairs} cặp`} color="text-blue-400" icon={<Cpu className="w-3 h-3" />} />
          <StatBox
            label="THỜI GIAN"
            value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
            color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
            icon={<Clock className="w-3 h-3" />}
          />
        </div>

        <div className="flex items-center gap-4 bg-card px-6 py-2 rounded-full border border-border flex-shrink-0 flex-wrap justify-center">
          <div className={cn("flex items-center gap-2", isPlayerTurn ? "text-purple-400" : "text-muted-foreground")}>
            <User className="w-4 h-4" />
            <span className="font-bold text-sm">LƯỢT BẠN</span>
          </div>
          <span className="text-muted-foreground">|</span>
          <div className={cn("flex items-center gap-2", !isPlayerTurn ? "text-blue-400" : "text-muted-foreground")}>
            <Cpu className="w-4 h-4" />
            <span className="font-bold text-sm">LƯỢT MÁY</span>
          </div>
          {!isPlayerTurn && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          {comboCount > 0 && isPlayerTurn && (
            <span className="text-amber-400 font-bold text-sm animate-pulse">
              <Zap className="w-4 h-4 inline" /> COMBO x{comboCount}
            </span>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl" />
          <div
            className={cn(
              "relative grid gap-3 bg-card p-4 rounded-2xl shadow-2xl border-4 border-border transition-all",
              !isPlayerTurn && "opacity-80"
            )}
            style={{
              gridTemplateColumns: `repeat(${config?.cols || 4}, 1fr)`,
              width: "min(80vw, 50vh, 600px)",
              aspectRatio: `${config?.cols || 4}/${config?.rows || 4}`
            }}
          >
            {cards.map((icon, i) => {
              const isFlipped = flippedIndices.includes(i);
              const isMatched = matchedIndices.includes(i);
              const isRevealed = isFlipped || isMatched;
              const isHinted = hintIndices.includes(i);

              return (
                <div
                  key={i}
                  onClick={() => handleCardClick(i)}
                  className={cn(
                    "rounded-xl flex items-center justify-center text-3xl sm:text-4xl transition-all duration-300 cursor-pointer border-2 relative aspect-square",
                    isMatched && CELL_COLORS.matched,
                    isFlipped && !isMatched && CELL_COLORS.flipped,
                    !isRevealed && CELL_COLORS.hidden,
                    isHinted && CELL_COLORS.hinted,
                    !isPlayerTurn && "pointer-events-none"
                  )}
                >
                  <span className={cn("transition-opacity duration-300 pointer-events-none", isRevealed ? "opacity-100" : "opacity-0")}>{icon}</span>
                  {!isRevealed && <HelpCircle className="w-1/3 h-1/3 text-muted-foreground absolute opacity-50" />}
                </div>
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
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Đang lưu..." : "Lưu Game"}
        </Button>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Tạm dừng game</AlertDialogTitle>
            <AlertDialogDescription>Bạn muốn làm gì tiếp theo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelExit} variant="outline" className="border-border text-muted-foreground hover:bg-secondary">
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
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn đang có trận đấu dở</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Bạn có muốn lưu trận đấu hiện tại trước khi rời đi không?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelNavigation} variant="outline" className="border-border text-muted-foreground hover:bg-secondary">
              Ở lại tiếp tục
            </Button>
            <AlertDialogCancel onClick={handleNavigationWithoutSave} className="bg-secondary text-foreground hover:bg-secondary/80">
              Rời đi không lưu
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
    <div className="bg-card border border-border p-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-center min-h-[60px]">
      <div className={cn("flex items-center gap-1 mb-0.5", color)}>
        {icon}
        <span className="text-[8px] font-black tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-mono font-black", color)}>{value}</span>
    </div>
  );
}
