import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Trophy, Frown, Target, Clock, User, HelpCircle, Save } from "lucide-react";
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

const DEFAULT_GRID_SIZE = 15;
const INITIAL_PLAYER_SNAKE = [
  { x: 3, y: 7 },
  { x: 2, y: 7 },
  { x: 1, y: 7 },
];
const INITIAL_CPU_SNAKE = [
  { x: 11, y: 7 },
  { x: 12, y: 7 },
  { x: 13, y: 7 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const DEFAULT_SPEED = 350; // ms per move - slow enough to be playable

// Color definitions for cells
// Color definitions with enhanced smooth effects
const CELL_COLORS = {
  empty: "bg-card/40 border border-border",
  food: "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] rounded-full",
  playerHead: "bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.8)] scale-[1.15] rounded-xl z-20",
  playerHeadHint: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-[1.15] rounded-xl z-20",
  playerBody: "bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-lg shadow-md border-t border-white/20",
  cpuHead: "bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-[1.15] rounded-xl z-20",
  cpuBody: "bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg shadow-md border-t border-white/20",
};

// Game instructions
const GAME_INSTRUCTIONS = [
  {
    title: "Mục tiêu trò chơi",
    content: "Sống sót và ăn nhiều mồi càng tốt để ghi điểm. Tồn tại cho đến khi hết giờ là bạn chiến thắng!",
  },
  {
    title: "Cách điều khiển bằng chuột",
    content: "Sử dụng CHUỘT trái để điều hướng rắn. CLICK vào bất kỳ ô nào trên bàn cờ để rắn di chuyển về hướng đó.",
  },
  {
    title: "Quy tắc ăn mồi",
    content: "Ăn mồi đỏ: +50 điểm và rắn dài thêm 1 ô. Máy sẽ tự động tạo mồi mới tại vị trí ngẫu nhiên sau khi bạn ăn.",
  },
  {
    title: "Rắn đối thủ (CPU)",
    content: "Có một con rắn máy (màu xanh dương) cũng đang cạnh tranh mồi với bạn. Nếu nó ăn mồi trước, bạn mất cơ hội ghi điểm!",
  },
  {
    title: "Điều kiện thua cuộc",
    content: "Trò chơi kết thúc nếu rắn tự cắn vào thân mình hoặc va vào rắn CPU. Hãy cẩn thận!",
  },
  {
    title: "Quyền trợ giúp (Hint)",
    content: "Nhấn nút HINT để AI tự động điều khiển rắn trong 5 bước tiếp theo. Phí: -30 điểm.",
  },
  {
    title: "Điều kiện chiến thắng",
    content: "Sống sót cho đến khi đồng hồ đếm ngược về 0.",
  },
];

export default function SnakeGame({ setControllerConfig }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [gameId, setGameId] = useState(null);

  const [playerSnake, setPlayerSnake] = useState(INITIAL_PLAYER_SNAKE);
  const [cpuSnake, setCpuSnake] = useState(INITIAL_CPU_SNAKE);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [food, setFood] = useState({ x: 7, y: 10 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [cpuDirection, setCpuDirection] = useState({ x: -1, y: 0 });
  const [score, setScore] = useState(0);
  const [hintSteps, setHintSteps] = useState(0);

  // Timer & Game state
  const [selectedTimeOption, setSelectedTimeOption] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [totalGameTime, setTotalGameTime] = useState(300);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const gameLoopRef = useRef();
  const directionRef = useRef(INITIAL_DIRECTION);
  const cpuDirectionRef = useRef({ x: -1, y: 0 });
  const timerRef = useRef();
  const elapsedRef = useRef();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (setControllerConfig) {
      setControllerConfig({ disableLeft: gameStarted, disableRight: gameStarted });
    }
  }, [gameStarted, setControllerConfig]);

  useEffect(() => {
    const shouldBlock = gameStarted && !gameOver && !gameWon && !isNavigatingRef.current;

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
  }, [gameStarted, gameOver, gameWon]);

  // --- 1. FETCH CONFIG ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await gameService.getGameBySlug("snake");
        if (response.status === "success" && response.data?.config) {
          setConfig(response.data.config);
          setGameId(response.data.id);
          setGridSize(response.data.config.rows || response.data.config.cols || DEFAULT_GRID_SIZE);
          const times = response.data.config.times || [5, 10, 20];
          setTimeLeft(times[0] * 60);
          setTotalGameTime(times[0] * 60);
        } else {
          setConfig({ speed: DEFAULT_SPEED, times: [5, 10, 20] });
        }
      } catch (error) {
        console.error("Failed to fetch snake config:", error);
        setConfig({ speed: DEFAULT_SPEED, times: [5, 10, 20] });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // --- HELPERS ---
  const getRandomFood = useCallback((pSnake, cSnake) => {
    let newFood;
    let attempts = 0;
    while (attempts < 100) {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
      const isOnPlayer = pSnake.some((s) => s.x === newFood.x && s.y === newFood.y);
      const isOnCpu = cSnake.some((s) => s.x === newFood.x && s.y === newFood.y);
      if (!isOnPlayer && !isOnCpu) return newFood;
      attempts++;
    }
    return newFood;
  }, [gridSize]);

  // BFS for hint - find path to food, avoid both snakes
  const getHintDirection = useCallback((head, target, body, cpuBody) => {
    const queue = [[head]];
    const visited = new Set([`${head.x},${head.y}`]);
    body.slice(1).forEach((s) => visited.add(`${s.x},${s.y}`));
    cpuBody.forEach((s) => visited.add(`${s.x},${s.y}`));

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];

      if (curr.x === target.x && curr.y === target.y) {
        if (path.length > 1) {
          const firstStep = path[1];
          let dx = firstStep.x - head.x;
          let dy = firstStep.y - head.y;
          if (dx > 1) dx = -1;
          if (dx < -1) dx = 1;
          if (dy > 1) dy = -1;
          if (dy < -1) dy = 1;
          return { x: dx, y: dy };
        }
        break;
      }

      const neighbors = [
        { x: (curr.x + 1 + gridSize) % gridSize, y: curr.y },
        { x: (curr.x - 1 + gridSize) % gridSize, y: curr.y },
        { x: curr.x, y: (curr.y + 1 + gridSize) % gridSize },
        { x: curr.x, y: (curr.y - 1 + gridSize) % gridSize },
      ].filter((n) => !visited.has(`${n.x},${n.y}`));

      for (const neighbor of neighbors) {
        visited.add(`${neighbor.x},${neighbor.y}`);
        queue.push([...path, neighbor]);
      }
    }
    return null;
  }, [gridSize]);

  // CPU random safe direction
  const getCpuRandomDirection = useCallback((head, currentDir, cpuBody, playerBody) => {
    const possibleDirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    // Filter out reverse direction
    const validDirs = possibleDirs.filter((d) => !(d.x === -currentDir.x && d.y === -currentDir.y));
    const shuffled = validDirs.sort(() => Math.random() - 0.5);

    for (const dir of shuffled) {
      const newHead = {
        x: (head.x + dir.x + gridSize) % gridSize,
        y: (head.y + dir.y + gridSize) % gridSize,
      };

      const hitsOwnBody = cpuBody.slice(1).some((s) => s.x === newHead.x && s.y === newHead.y);
      const hitsPlayer = playerBody.some((s) => s.x === newHead.x && s.y === newHead.y);

      if (!hitsOwnBody && !hitsPlayer) {
        return dir;
      }
    }

    return currentDir;
  }, [gridSize]);

  // --- INIT GAME ---
  const initGame = useCallback(() => {
    setPlayerSnake(INITIAL_PLAYER_SNAKE);
    setCpuSnake(INITIAL_CPU_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setCpuDirection({ x: -1, y: 0 });
    directionRef.current = INITIAL_DIRECTION;
    cpuDirectionRef.current = { x: -1, y: 0 };
    setFood({ x: 7, y: 10 });
    setScore(0);
    setHintSteps(0);
    setGameOver(false);
    setGameWon(false);
  }, []);

  // --- START GAME ---
  const startGame = (timeIndex) => {
    const times = config?.times || [5, 10, 20];
    setSelectedTimeOption(timeIndex);
    const gameTime = times[timeIndex] * 60;
    setTimeLeft(gameTime);
    setTotalGameTime(gameTime);
    setElapsedTime(0);
    initGame();
    setGameStarted(true);
  };

  // --- CLICK ON CELL TO SET DIRECTION ---
  const handleCellClick = useCallback(
    (x, y) => {
      if (gameOver || !gameStarted || hintSteps > 0) return;

      const head = playerSnake[0];

      // Calculate direction from head to clicked cell
      let dx = x - head.x;
      let dy = y - head.y;

      // Handle wrap-around
      if (dx > gridSize / 2) dx -= gridSize;
      if (dx < -gridSize / 2) dx += gridSize;
      if (dy > gridSize / 2) dy -= gridSize;
      if (dy < -gridSize / 2) dy += gridSize;

      // Determine primary direction (horizontal or vertical)
      let newDir;
      if (Math.abs(dx) >= Math.abs(dy)) {
        newDir = { x: dx > 0 ? 1 : -1, y: 0 };
      } else {
        newDir = { x: 0, y: dy > 0 ? 1 : -1 };
      }

      // Prevent reversing into self
      const currentDir = directionRef.current;
      if (newDir.x === -currentDir.x && newDir.y === -currentDir.y) {
        return;
      }

      directionRef.current = newDir;
      setDirection(newDir);
    },
    [gameOver, gameStarted, hintSteps, playerSnake]
  );

  // --- GAME LOOP - Move both snakes ---
  const moveSnakes = useCallback(() => {
    if (gameOver || !gameStarted) return;

    // Move Player
    setPlayerSnake((prevSnake) => {
      let nextDir = directionRef.current;

      // Hint Logic - AI takes control
      if (hintSteps > 0) {
        const aiDir = getHintDirection(prevSnake[0], food, prevSnake, cpuSnake);
        if (aiDir) {
          nextDir = aiDir;
          directionRef.current = nextDir;
          setDirection(nextDir);
        }
        setHintSteps((prev) => prev - 1);
      }

      const head = prevSnake[0];
      const newHead = {
        x: (head.x + nextDir.x + gridSize) % gridSize,
        y: (head.y + nextDir.y + gridSize) % gridSize,
      };

      // Check collision with own body
      if (prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      // Check collision with CPU snake
      if (cpuSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Eat Food?
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 50);
        setFood(getRandomFood(newSnake, cpuSnake));
        toast({
          title: "+50 điểm!",
          description: "Bạn ăn được mồi!",
          className: "bg-emerald-600 border-none text-white",
          duration: 1000,
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });

    // Move CPU (random direction)
    setCpuSnake((prevCpu) => {
      const currentDir = cpuDirectionRef.current;
      const newDir = getCpuRandomDirection(prevCpu[0], currentDir, prevCpu, playerSnake);
      cpuDirectionRef.current = newDir;
      setCpuDirection(newDir);

      const head = prevCpu[0];
      const newHead = {
        x: (head.x + newDir.x + gridSize) % gridSize,
        y: (head.y + newDir.y + gridSize) % gridSize,
      };

      // Check if CPU hits itself or player (respawn)
      const hitsSelf = prevCpu.slice(1).some((s) => s.x === newHead.x && s.y === newHead.y);
      const hitsPlayer = playerSnake.some((s) => s.x === newHead.x && s.y === newHead.y);

      if (hitsSelf || hitsPlayer) {
        // CPU respawns
        return INITIAL_CPU_SNAKE;
      }

      const newCpu = [newHead, ...prevCpu];

      // CPU eats food?
      if (newHead.x === food.x && newHead.y === food.y) {
        setFood(getRandomFood(playerSnake, newCpu));
        toast({
          title: "Máy ăn mồi!",
          description: "Rắn CPU tranh được mồi",
          className: "bg-blue-600 border-none text-white",
          duration: 1000,
        });
      } else {
        newCpu.pop();
      }

      return newCpu;
    });
  }, [gameOver, gameStarted, food, hintSteps, cpuSnake, playerSnake, getRandomFood, getHintDirection, getCpuRandomDirection, toast]);

  // --- GAME LOOP INTERVAL ---
  useEffect(() => {
    if (loading || gameOver || !gameStarted) return;

    // Use fixed speed for better playability (ignore config speed)
    const speed = DEFAULT_SPEED;
    gameLoopRef.current = setInterval(moveSnakes, speed);
    return () => clearInterval(gameLoopRef.current);
  }, [loading, gameOver, gameStarted, moveSnakes]);

  // --- TIMER ---
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameWon(true);
          setGameOver(true);
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
  }, [gameStarted, gameOver]);

  // --- KEYBOARD CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;

      const times = config?.times || [5, 10, 20];

      // Config screen controls
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

      // In-game controls
      if (!gameOver) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            if (hintSteps === 0) {
              // Đi sang trái
              const currentDir = directionRef.current;
              const newDir = { x: -1, y: 0 };
              // Ngăn đi ngược lại
              if (!(newDir.x === -currentDir.x && newDir.y === -currentDir.y)) {
                directionRef.current = newDir;
                setDirection(newDir);
              }
            }
            break;
          case "ArrowRight":
            e.preventDefault();
            if (hintSteps === 0) {
              // Đi sang phải
              const currentDir = directionRef.current;
              const newDir = { x: 1, y: 0 };
              // Ngăn đi ngược lại
              if (!(newDir.x === -currentDir.x && newDir.y === -currentDir.y)) {
                directionRef.current = newDir;
                setDirection(newDir);
              }
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            if (hintSteps === 0) {
              // Đi lên
              const currentDir = directionRef.current;
              const newDir = { x: 0, y: -1 };
              // Ngăn đi ngược lại
              if (!(newDir.x === -currentDir.x && newDir.y === -currentDir.y)) {
                directionRef.current = newDir;
                setDirection(newDir);
              }
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            if (hintSteps === 0) {
              // Đi xuống
              const currentDir = directionRef.current;
              const newDir = { x: 0, y: 1 };
              // Ngăn đi ngược lại
              if (!(newDir.x === -currentDir.x && newDir.y === -currentDir.y)) {
                directionRef.current = newDir;
                setDirection(newDir);
              }
            }
            break;
          case "h":
          case "H":
            e.preventDefault();
            if (hintSteps === 0) {
              setHintSteps(5);
              setScore((prev) => Math.max(0, prev - 30));
            }
            break;
          case "Escape":
          case "Backspace":
            e.preventDefault();
            clearInterval(gameLoopRef.current);
            clearInterval(timerRef.current);
            clearInterval(elapsedRef.current);
            setShowExitDialog(true);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, gameStarted, gameOver, selectedTimeOption, config, navigate, hintSteps]);

  // --- SAVE HISTORY when game ends ---
  useEffect(() => {
    const saveHistory = async () => {
      if (gameOver && gameId && gameStarted) {
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
  }, [gameOver, gameId, score, elapsedTime, gameStarted]);

  // Handle back from config screen
  const handleBackFromConfig = () => {
    if (score > 0) {
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

  // Handle exit with save from gameplay
  const handleExitGameWithSave = async () => {
    await handleSave();
    setShowExitDialog(false);
    setGameStarted(false);
    setGameOver(false);
  };

  // Handle exit without save from gameplay
  const handleExitGameWithoutSave = () => {
    setShowExitDialog(false);
    setGameStarted(false);
    setGameOver(false);
  };

  // Handle cancel exit (resume game)
  const handleCancelExit = () => {
    setShowExitDialog(false);
    // Resume game loop and timers
    if (gameStarted && !gameOver) {
      const speed = DEFAULT_SPEED;
      gameLoopRef.current = setInterval(moveSnakes, speed);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameWon(true);
            setGameOver(true);
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

  const handleBack = () => {
    if (gameStarted && !gameOver) {
      clearInterval(gameLoopRef.current);
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
      setShowExitDialog(true);
    } else if (!gameStarted) {
      handleBackFromConfig();
    }
  };

  // Save game
  const handleSave = async () => {
    if (!gameId) return;
    setIsSaving(true);
    try {
      await gameService.saveGameSession({
        game_id: gameId,
        matrix_state: JSON.stringify({
          playerSnake,
          food,
          direction: directionRef.current,
          timeLeft,
          totalGameTime,
        }),
        current_score: score,
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

  // Load game
  const handleLoad = async () => {
    if (!gameId) return;
    setIsLoadingSession(true);
    try {
      const response = await gameService.getLastSession(gameId);
      if (response.status === "success" && response.data) {
        const session = response.data;
        const state = JSON.parse(session.matrix_state);

        setPlayerSnake(state.playerSnake);
        setFood(state.food);
        directionRef.current = state.direction;
        setDirection(state.direction);
        setScore(session.current_score || 0);

        const savedTimeLeft = state.timeLeft || state.totalGameTime - session.elapsed_time || 300;
        setTimeLeft(savedTimeLeft);
        setTotalGameTime(state.totalGameTime || savedTimeLeft);
        setElapsedTime(session.elapsed_time || 0);

        setGameStarted(true);
        setGameOver(false);
        setGameWon(false);

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

  // --- LOADING STATE ---
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <span className="text-muted-foreground font-mono animate-pulse">LOADING_SNAKE_GAME...</span>
      </div>
    );

  const times = config?.times || [5, 10, 20];

  // --- TIME SELECTION SCREEN ---
  if (!gameStarted && !gameOver) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight flex items-center justify-center gap-3">🐍 SNAKE GAME</h2>
          <p className="text-muted-foreground text-sm">Click vào ô để điều khiển hướng rắn!</p>
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
                  : "bg-card/60 border-border hover:border-border/80"
              )}
            >
              <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-emerald-400" : "text-muted-foreground")} />
              <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-emerald-400" : "text-muted-foreground")}>{t} phút</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleLoad}
          variant="outline"
          className="border-border text-muted-foreground hover:bg-accent px-8 py-4 rounded-xl"
          disabled={isLoadingSession}
        >
          {isLoadingSession ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Tiếp tục game đã lưu
        </Button>

        {/* Instructions Dialog */}
        <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
                Hướng dẫn chơi Snake
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-muted-foreground mt-4">
                  {GAME_INSTRUCTIONS.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-emerald-500 pl-3">
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
              <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-500">Đã hiểu</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Exit Dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Lưu game trước khi thoát?</AlertDialogTitle>
              <AlertDialogDescription>Bạn có muốn lưu tiến trình game hiện tại không?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleExitWithoutSave} className="bg-accent text-foreground hover:bg-accent/80">
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

  // --- MAIN GAME SCREEN ---
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-5xl h-full px-4 py-2 justify-center">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 w-full max-w-2xl gap-3">
        <StatBox label="ĐIỂM" value={score} color="text-emerald-400" icon={<Target className="w-3 h-3" />} />
        <StatBox label="ĐỘ DÀI" value={`${playerSnake.length} ô`} color="text-emerald-400" icon={<User className="w-3 h-3" />} />
        <StatBox
          label="THỜI GIAN"
          value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
          color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
          icon={<Clock className="w-3 h-3" />}
        />
      </div>

      {/* Game Board */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2rem] blur-2xl" />

        <div
          className="relative grid gap-[2px] p-3 bg-card rounded-2xl border-4 border-border shadow-2xl ring-1 ring-border"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: "min(90vw, 65vh)",
            aspectRatio: "1/1",
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const isFood = food.x === x && food.y === y;
            const playerIdx = playerSnake.findIndex((s) => s.x === x && s.y === y);
            const cpuIdx = cpuSnake.findIndex((s) => s.x === x && s.y === y);
            const isPlayerHead = playerIdx === 0;
            const isPlayerBody = playerIdx > 0;
            const isCpuHead = cpuIdx === 0;
            const isCpuBody = cpuIdx > 0;
            const isHintActive = hintSteps > 0;
            const isEmpty = !isFood && playerIdx === -1 && cpuIdx === -1;

            return (
              <div
                key={i}
                onClick={() => handleCellClick(x, y)}
                className={cn(
                  "rounded-[4px] relative cursor-pointer",
                  // CRITICAL: Duration 300ms matches closely with 350ms game speed for continuous flow
                  // ease-linear removes the stop-start feel
                  "transition-all duration-300 ease-linear transform-gpu will-change-transform",
                  CELL_COLORS.empty,
                  isFood && CELL_COLORS.food,
                  isPlayerHead && (isHintActive ? CELL_COLORS.playerHeadHint : CELL_COLORS.playerHead),
                  isPlayerBody && CELL_COLORS.playerBody,
                  isCpuHead && CELL_COLORS.cpuHead,
                  isCpuBody && CELL_COLORS.cpuBody,
                  isEmpty && !gameOver && "hover:bg-emerald-500/20 hover:scale-110 duration-75"
                )}
                style={{
                  // Subtle scaling for body to give organic feel
                  // Opacity gradient creates a trail effect
                  transform: isPlayerBody || isCpuBody ? "scale(0.92)" : isPlayerHead || isCpuHead ? "scale(1.15)" : undefined,
                  opacity: isPlayerBody ? Math.max(0.7, 1 - playerIdx * 0.03) : isCpuBody ? Math.max(0.7, 1 - cpuIdx * 0.03) : 1,
                  zIndex: isPlayerHead || isCpuHead ? 20 : isPlayerBody || isCpuBody ? 10 : 0,
                }}
              >
                {isFood && <div className="absolute inset-2 bg-white/40 rounded-full animate-ping" />}

                {/* 3D Shine Effect for Heads */}
                {(isPlayerHead || isCpuHead) && <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 rounded-xl" />}

                {/* Eyes for Player Snake */}
                {isPlayerHead && (
                  <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
                  </div>
                )}

                {/* Eyes for CPU Snake */}
                {isCpuHead && (
                  <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                    <div className="w-1.5 h-1.5 bg-red-900 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-red-900 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-30 animate-in fade-in zoom-in duration-300">
              <div
                className={cn(
                  "p-6 border rounded-3xl shadow-2xl flex flex-col items-center max-w-[80%] text-center",
                  gameWon ? "bg-emerald-900/50 border-emerald-500/50" : "bg-rose-900/50 border-rose-500/50"
                )}
              >
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4", gameWon ? "bg-emerald-500/20" : "bg-rose-500/20")}>
                  {gameWon ? <Trophy className="w-10 h-10 text-emerald-400" /> : <Frown className="w-10 h-10 text-rose-400" />}
                </div>
                <h2 className="text-3xl font-black text-foreground mb-1 tracking-tighter">{gameWon ? "BẠN THẮNG!" : "GAME OVER"}</h2>
                <p className="text-muted-foreground text-sm mb-6 font-mono">ĐIỂM: {score}</p>
                <Button
                  onClick={() => {
                    setGameStarted(false);
                    setGameOver(false);
                    setGameWon(false);
                  }}
                  className={cn(
                    "w-full text-white font-bold py-6 rounded-2xl",
                    gameWon ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  )}
                >
                  <RefreshCw className="mr-2 h-5 w-5" /> CHƠI LẠI
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Game Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !gameStarted || gameOver}
        className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isSaving ? "Đang lưu..." : "Lưu Game"}
      </Button>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Tạm dừng game</AlertDialogTitle>
            <AlertDialogDescription>Bạn muốn làm gì tiếp theo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelExit} variant="outline" className="border-border text-muted-foreground hover:bg-accent">
              Tiếp tục chơi
            </Button>
            <AlertDialogCancel onClick={handleExitGameWithoutSave} className="bg-accent text-foreground hover:bg-accent/80">
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
            <Button onClick={handleCancelNavigation} variant="outline" className="border-border text-muted-foreground hover:bg-accent">
              Ở lại tiếp tục
            </Button>
            <AlertDialogCancel onClick={handleNavigationWithoutSave} className="bg-accent text-foreground hover:bg-accent/80">
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
    <div className="bg-card/60 border border-border p-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-center">
      <div className={cn("flex items-center gap-1 mb-0.5", color)}>
        {icon}
        <span className="text-[8px] font-black tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-mono font-black", color)}>{typeof value === "number" ? String(value).padStart(4, "0") : value}</span>
    </div>
  );
}
