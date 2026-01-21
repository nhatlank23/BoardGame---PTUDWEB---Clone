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

// AI Difficulty Levels
const AI_LEVELS = [
  { id: 1, name: "Dễ", color: "emerald", description: "AI đi ngẫu nhiên, dễ thắng" },
  { id: 2, name: "Trung bình", color: "amber", description: "AI có chiến thuật cơ bản" },
  { id: 3, name: "Khó", color: "rose", description: "AI thông minh, khó đánh bại" },
];

export default function CaroGame({ winCount = 5, setControllerConfig }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ rows: 12, cols: 12, winCount: winCount, times: [5, 10, 20] });
  const [gameId, setGameId] = useState(null);

  const [board, setBoard] = useState([]);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [hintCell, setHintCell] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState(1); // 1=Easy, 2=Medium, 3=Hard

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
    if (setControllerConfig) {
      setControllerConfig({ disableLeft: gameStarted, disableRight: gameStarted });
    }
  }, [gameStarted, setControllerConfig]);

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

  // ========== AI ENGINE ==========

  // Get valid moves - empty cells near existing pieces
  const getValidMoves = useCallback((currentBoard) => {
    const emptyIndices = [];
    const hasAdjacentPiece = (idx) => {
      const r = Math.floor(idx / config.cols);
      const c = idx % config.cols;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
            if (currentBoard[nr * config.cols + nc] !== null) return true;
          }
        }
      }
      return false;
    };

    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === null) {
        // If board is empty, only consider center area
        const hasPieces = currentBoard.some(c => c !== null);
        if (!hasPieces) {
          const r = Math.floor(i / config.cols);
          const c = i % config.cols;
          const centerR = Math.floor(config.rows / 2);
          const centerC = Math.floor(config.cols / 2);
          if (Math.abs(r - centerR) <= 2 && Math.abs(c - centerC) <= 2) {
            emptyIndices.push(i);
          }
        } else if (hasAdjacentPiece(i)) {
          emptyIndices.push(i);
        }
      }
    }
    return emptyIndices.length > 0 ? emptyIndices : currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
  }, [config]);

  // Evaluate a line for scoring
  const evaluateLine = useCallback((currentBoard, startIdx, dr, dc, player) => {
    const ROWS = config.rows;
    const COLS = config.cols;
    const WIN = config.winCount;
    const r0 = Math.floor(startIdx / COLS);
    const c0 = startIdx % COLS;

    let consecutive = 0;
    let openEnds = 0;
    let blocked = false;

    // Count consecutive in positive direction
    let i = 0;
    while (true) {
      const nr = r0 + dr * i;
      const nc = c0 + dc * i;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
        blocked = true;
        break;
      }
      const idx = nr * COLS + nc;
      if (currentBoard[idx] === player) {
        consecutive++;
        i++;
      } else if (currentBoard[idx] === null) {
        openEnds++;
        break;
      } else {
        blocked = true;
        break;
      }
    }

    // Count consecutive in negative direction
    i = -1;
    while (true) {
      const nr = r0 + dr * i;
      const nc = c0 + dc * i;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
        blocked = true;
        break;
      }
      const idx = nr * COLS + nc;
      if (currentBoard[idx] === player) {
        consecutive++;
        i--;
      } else if (currentBoard[idx] === null) {
        openEnds++;
        break;
      } else {
        blocked = true;
        break;
      }
    }

    // Cập nhật phần trả về kết quả ở cuối hàm evaluateLine
    const scoreTable = {
      WIN: 1000000,          // Đã đủ 5 quân
      LIVE_4: 100000,        // 4 quân hở 2 đầu (Chắc chắn thắng)
      DEAD_4: 10000,         // 4 quân bị chặn 1 đầu (Bắt buộc phải chặn)
      LIVE_3: 10000,         // 3 quân hở 2 đầu (Cực kỳ nguy hiểm, tạo ra 4 hở 2 đầu)
      DEAD_3: 1000,          // 3 quân bị chặn 1 đầu
      LIVE_2: 500,           // 2 quân hở 2 đầu
      DEAD_2: 100            // 2 quân bị chặn 1 đầu
    };

    if (consecutive >= WIN) return scoreTable.WIN;

    if (consecutive === WIN - 1) {
      // Thế 4 quân
      return openEnds >= 2 ? scoreTable.LIVE_4 : (openEnds === 1 ? scoreTable.DEAD_4 : 0);
    }

    if (consecutive === WIN - 2) {
      if (openEnds >= 2) return 10000;
      if (openEnds === 1) return 1000;
      return 0;
    }

    if (consecutive === WIN - 3) {
      // Thế 2 quân
      return openEnds >= 2 ? scoreTable.LIVE_2 : (openEnds === 1 ? scoreTable.DEAD_2 : 0);
    }

    return consecutive * 10; // Các trường hợp lẻ tẻ khác
  }, [config]);

  // Evaluate position score for a player
  const evaluatePosition = useCallback((currentBoard, idx, player) => {
    const COLS = config.cols;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let score = 0;

    for (const [dr, dc] of directions) {
      score += evaluateLine(currentBoard, idx, dr, dc, player);
    }

    // Position bonus - prefer center
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    const centerR = Math.floor(config.rows / 2);
    const centerC = Math.floor(COLS / 2);
    const distanceFromCenter = Math.abs(r - centerR) + Math.abs(c - centerC);
    score += Math.max(0, 10 - distanceFromCenter);

    return score;
  }, [config, evaluateLine]);

  // EASY AI: Random with basic threat detection
  const getEasyMove = useCallback((currentBoard) => {
    const validMoves = getValidMoves(currentBoard);
    if (validMoves.length === 0) return null;

    // 30% chance to make a smart move (block or attack)
    if (Math.random() < 0.3) {
      // Check for immediate threats from player
      for (const idx of validMoves) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "X";
        if (checkWin(testBoard, idx, "X")) {
          return idx; // Block winning move
        }
      }
      // Check for own winning move
      for (const idx of validMoves) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "O";
        if (checkWin(testBoard, idx, "O")) {
          return idx; // Take winning move
        }
      }
    }

    // Otherwise, random move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }, [getValidMoves, checkWin]);

  // MEDIUM AI: Heuristic scoring
  const getMediumMove = useCallback((currentBoard) => {
    const validMoves = getValidMoves(currentBoard);
    if (validMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const idx of validMoves) {
      // Check for immediate win
      const testBoard = [...currentBoard];
      testBoard[idx] = "O";
      if (checkWin(testBoard, idx, "O")) {
        return idx; // Take winning move immediately
      }

      // Check for blocking player win
      testBoard[idx] = "X";
      if (checkWin(testBoard, idx, "X")) {
        return idx; // Block player's winning move
      }

      // Calculate heuristic score
      testBoard[idx] = "O";
      const attackScore = evaluatePosition(testBoard, idx, "O");

      testBoard[idx] = "X";
      const defenseScore = evaluatePosition(testBoard, idx, "X") * 0.9; // Slightly favor attack

      const totalScore = attackScore + defenseScore;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = idx;
      }
    }

    return bestMove;
  }, [getValidMoves, checkWin, evaluatePosition]);

  // HARD AI: Minimax with Alpha-Beta Pruning
  const getHardMove = useCallback((currentBoard) => {
    const validMoves = getValidMoves(currentBoard);
    if (validMoves.length === 0) return null;

    // Helper: Check if placing at idx creates a "live N" pattern (N consecutive with 2 open ends)
    const hasLiveN = (board, idx, player, n) => {
      const ROWS = config.rows;
      const COLS = config.cols;
      const r = Math.floor(idx / COLS);
      const c = idx % COLS;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

      for (const [dr, dc] of directions) {
        let count = 1; // The placed piece
        let openEnds = 0;

        // Count forward
        let i = 1;
        while (true) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          const cellIdx = nr * COLS + nc;
          if (board[cellIdx] === player) {
            count++;
            i++;
          } else if (board[cellIdx] === null) {
            openEnds++;
            break;
          } else {
            break;
          }
        }

        // Count backward
        i = 1;
        while (true) {
          const nr = r - dr * i;
          const nc = c - dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          const cellIdx = nr * COLS + nc;
          if (board[cellIdx] === player) {
            count++;
            i++;
          } else if (board[cellIdx] === null) {
            openEnds++;
            break;
          } else {
            break;
          }
        }

        if (count >= n && openEnds >= 2) return true;
      }
      return false;
    };

    // 1. Check for immediate win
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "O";
      if (checkWin(testBoard, idx, "O")) return idx;
    }

    // 2. Block immediate player win
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "X";
      if (checkWin(testBoard, idx, "X")) return idx;
    }

    // 3. Check for creating LIVE_4 (4 with 2 open ends - guaranteed win)
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "O";
      if (hasLiveN(testBoard, idx, "O", config.winCount - 1)) return idx;
    }

    // 4. Block player's LIVE_3 (3 with 2 open ends - will become LIVE_4)
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "X";
      if (hasLiveN(testBoard, idx, "X", config.winCount - 2)) return idx;
    }

    // 5. Create our own LIVE_3
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "O";
      if (hasLiveN(testBoard, idx, "O", config.winCount - 2)) return idx;
    }

    // 6. Detect and create/block DOUBLE THREAT (fork) - critical for winning
    // Check if we can create a fork (2 live-3s at once)
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "O";
      let liveThreeCount = 0;
      for (const move of validMoves) {
        if (move === idx) continue;
        if (hasLiveN(testBoard, move, "O", config.winCount - 2)) {
          liveThreeCount++;
          if (liveThreeCount >= 2) return idx; // Fork! Guaranteed win
        }
      }
    }

    // Block opponent's potential fork
    for (const idx of validMoves) {
      const testBoard = [...currentBoard];
      testBoard[idx] = "X";
      let opponentLiveThreeCount = 0;
      for (const move of validMoves) {
        if (move === idx) continue;
        const testBoard2 = [...testBoard];
        testBoard2[move] = "X";
        if (hasLiveN(testBoard2, move, "X", config.winCount - 2)) {
          opponentLiveThreeCount++;
        }
      }
      if (opponentLiveThreeCount >= 2) return idx; // Block fork
    }

    const DEPTH = 5; // Increased search depth for stronger play

    const evaluateBoard = (board) => {
      let score = 0;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === "O") {
          score += evaluatePosition(board, i, "O");
        } else if (board[i] === "X") {
          score -= evaluatePosition(board, i, "X") * 1.1; // Prioritize defense slightly
        }
      }
      return score;
    };

    const minimax = (board, depth, alpha, beta, isMaximizing, lastMove) => {
      // Check terminal states
      if (lastMove !== null) {
        const lastPlayer = isMaximizing ? "X" : "O";
        if (checkWin(board, lastMove, lastPlayer)) {
          return isMaximizing ? -1000000 + (DEPTH - depth) : 1000000 - (DEPTH - depth);
        }
      }

      if (depth === 0) {
        return evaluateBoard(board);
      }

      const moves = getValidMoves(board).slice(0, 8); // Limit moves for performance
      if (moves.length === 0) return 0;

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          const newBoard = [...board];
          newBoard[move] = "O";
          const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, move);
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          const newBoard = [...board];
          newBoard[move] = "X";
          const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, move);
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    };

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    // Sort moves by heuristic for better pruning - consider both attack and defense
    const scoredMoves = validMoves.map(idx => {
      const testBoard = [...currentBoard];
      testBoard[idx] = "O";
      const attackScore = evaluatePosition(testBoard, idx, "O");
      testBoard[idx] = "X";
      const defenseScore = evaluatePosition(testBoard, idx, "X");
      return { idx, score: attackScore + defenseScore * 0.8 };
    }).sort((a, b) => b.score - a.score).slice(0, 15);

    for (const { idx } of scoredMoves) {
      const newBoard = [...currentBoard];
      newBoard[idx] = "O";
      const score = minimax(newBoard, DEPTH - 1, -Infinity, Infinity, false, idx);
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove;
  }, [getValidMoves, checkWin, evaluatePosition, config]);

  // Main AI move dispatcher
  const getAIMove = useCallback((currentBoard) => {
    switch (aiDifficulty) {
      case 1:
        return getEasyMove(currentBoard);
      case 2:
        return getMediumMove(currentBoard);
      case 3:
        return getHardMove(currentBoard);
      default:
        return getEasyMove(currentBoard);
    }
  }, [aiDifficulty, getEasyMove, getMediumMove, getHardMove]);  // Thắng: +1, Thua: -1, Hòa: 0
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

  // Improved findBestMove using AI heuristic for hints
  const findBestMove = useCallback(() => {
    const validMoves = getValidMoves(board);
    if (validMoves.length === 0) return null;

    // Check for immediate win for player
    for (const idx of validMoves) {
      const testBoard = [...board];
      testBoard[idx] = "X";
      if (checkWin(testBoard, idx, "X")) {
        return idx; // Suggest winning move
      }
    }

    // Check for blocking AI winning move
    for (const idx of validMoves) {
      const testBoard = [...board];
      testBoard[idx] = "O";
      if (checkWin(testBoard, idx, "O")) {
        return idx; // Suggest blocking move
      }
    }

    // Find best heuristic move for player
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const idx of validMoves) {
      const testBoard = [...board];
      testBoard[idx] = "X";
      const attackScore = evaluatePosition(testBoard, idx, "X");

      testBoard[idx] = "O";
      const defenseScore = evaluatePosition(testBoard, idx, "O") * 0.8;

      const totalScore = attackScore + defenseScore;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = idx;
      }
    }

    return bestMove;
  }, [board, getValidMoves, checkWin, evaluatePosition]);

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
        const aiMove = getAIMove(board);
        if (aiMove !== null) {
          const newBoard = [...board];
          newBoard[aiMove] = "O";
          setBoard(newBoard);

          if (checkWin(newBoard, aiMove, "O")) {
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
  }, [isXNext, winner, board, loading, gameStarted, gameEnded, checkWin, calculateRoundScore, saveRoundResult, toast, getAIMove]);

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
    // Reset board
    initBoard();
    // Reset timer back to the original game time
    setTimeLeft(totalGameTime);
    setElapsedTime(0);
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
          aiDifficulty,
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
        setAiDifficulty(state.aiDifficulty || 1);

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

        {/* AI Difficulty Selector */}
        <div className="w-full">
          <p className="text-center text-muted-foreground text-sm mb-3">Chọn độ khó AI</p>
          <div className="flex gap-3 justify-center">
            {AI_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setAiDifficulty(level.id)}
                className={cn(
                  "px-6 py-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 min-w-[100px]",
                  aiDifficulty === level.id
                    ? level.color === "emerald"
                      ? "bg-emerald-500/20 border-emerald-500 scale-105 shadow-lg shadow-emerald-500/30"
                      : level.color === "amber"
                        ? "bg-amber-500/20 border-amber-500 scale-105 shadow-lg shadow-amber-500/30"
                        : "bg-rose-500/20 border-rose-500 scale-105 shadow-lg shadow-rose-500/30"
                    : "bg-card border-border hover:border-muted-foreground"
                )}
              >
                <span className="text-3xl">{level.icon}</span>
                <span className={cn(
                  "text-sm font-bold",
                  aiDifficulty === level.id
                    ? level.color === "emerald" ? "text-emerald-400"
                      : level.color === "amber" ? "text-amber-400"
                        : "text-rose-400"
                    : "text-foreground"
                )}>{level.name}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-muted-foreground text-xs mt-2">
            {AI_LEVELS.find(l => l.id === aiDifficulty)?.description}
          </p>
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
      <div className="grid grid-cols-5 w-full max-w-2xl gap-2">
        <StatBox label="ĐIỂM" value={totalScore} color="text-emerald-400" icon={<Target className="w-4 h-4" />} />
        <StatBox label="VÁN" value={roundsPlayed} color="text-violet-400" icon={<Zap className="w-4 h-4" />} />
        <StatBox
          label="THỜI GIAN"
          value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
          color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
          icon={<Clock className="w-4 h-4" />}
        />
        <div className={cn(
          "bg-card border border-border p-2 rounded-xl flex flex-col items-center justify-center",
          aiDifficulty === 1 ? "border-emerald-500/50" : aiDifficulty === 2 ? "border-amber-500/50" : "border-rose-500/50"
        )}>
          <span className="text-xl">{AI_LEVELS.find(l => l.id === aiDifficulty)?.icon}</span>
          <span className={cn(
            "text-[9px] font-bold",
            aiDifficulty === 1 ? "text-emerald-400" : aiDifficulty === 2 ? "text-amber-400" : "text-rose-400"
          )}>AI {AI_LEVELS.find(l => l.id === aiDifficulty)?.name}</span>
        </div>
        <div className="bg-card border border-border p-2 rounded-xl flex items-center justify-center">
          <div className={cn("flex items-center gap-2", isXNext ? "text-red-400" : "text-blue-400")}>
            {isXNext ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
            <span className="font-bold text-xs">{isXNext ? "Bạn" : "Máy"}</span>
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
