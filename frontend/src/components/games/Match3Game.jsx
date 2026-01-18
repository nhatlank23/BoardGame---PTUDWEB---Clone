import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Trophy, Frown, Zap, Clock, Target, User, Cpu, ChevronLeft, ChevronRight, CornerDownLeft, ArrowLeft, Lightbulb, HelpCircle, X, Save } from "lucide-react";
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

const COLORS = ["red", "green", "blue", "yellow", "purple"];
const COLOR_CLASSES = {
    red: "bg-rose-500 shadow-rose-500/50",
    green: "bg-emerald-500 shadow-emerald-500/50",
    blue: "bg-sky-500 shadow-sky-500/50",
    yellow: "bg-amber-400 shadow-amber-400/50",
    purple: "bg-violet-500 shadow-violet-500/50",
};
const DEFAULT_TARGET_SCORE = 2000;
const AI_MOVE_INTERVAL = 10000;

// Game instructions
const GAME_INSTRUCTIONS = [
    {
        title: "Nhiệm vụ chính",
        content: "Hãy thu thập các viên kim cương cùng loại để đạt được mức điểm mục tiêu yêu cầu trước khi đồng hồ đếm ngược về 0."
    },
    {
        title: "Cách thức hoán đổi",
        content: "Dùng CHUỘT click vào một viên kim cương, sau đó click vào viên cạnh bên (trên, dưới, trái, phải) để hoán đổi vị trí. Lưu ý: Chỉ có thể hoán đổi nếu nước đi đó tạo ra ít nhất một hàng hoặc cột có 3 viên cùng màu."
    },
    {
        title: "Quy tắc ghi điểm",
        content: "Xếp 3 viên cùng màu: Ghi điểm cơ bản. Xếp 4 hoặc 5 viên: Tạo ra các viên đặc biệt và nhận số điểm lớn hơn nhiều lần."
    },
    {
        title: "Hệ thống Combo & Nhân điểm",
        content: "Nếu sau khi nổ, các viên kim cương mới rơi xuống tự động tạo thành các hàng/cột trùng khớp, bạn sẽ nhận được Combo. Điểm số sẽ được nhân (x2, x3, x4...) theo số tầng Combo liên tiếp."
    },
    {
        title: "Cơ chế 'Máy tự động'",
        content: "Để tăng độ khó, cứ mỗi 10 giây nếu bạn không thực hiện nước đi, Máy sẽ tự động thực hiện một lần hoán đổi ngẫu nhiên. Hãy nhanh tay để không bị Máy làm xáo trộn chiến thuật của bạn!"
    },
    {
        title: "Quyền trợ giúp (Hint)",
        content: "Nếu không tìm thấy nước đi, hãy nhấn nút HINT. Một cặp kim cương có thể tạo ra tổ hợp sẽ nhấp nháy. Tuy nhiên, mỗi lần dùng bạn sẽ bị trừ một lượng điểm nhỏ."
    }
];

export default function Match3Game() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [gridSize, setGridSize] = useState(10);

    const [board, setBoard] = useState([]);
    const [selectedPos, setSelectedPos] = useState(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [computerScore, setComputerScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300);
    const [totalGameTime, setTotalGameTime] = useState(300);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [comboMultiplier, setComboMultiplier] = useState(1);
    const [flashingCells, setFlashingCells] = useState([]);
    const [hintCells, setHintCells] = useState([]);
    const [invalidSwap, setInvalidSwap] = useState(false);

    // Game state flags
    const [selectedTimeOption, setSelectedTimeOption] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameStatus, setGameStatus] = useState("playing");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    const timerRef = useRef();
    const elapsedRef = useRef();
    const aiTimerRef = useRef();
    const containerRef = useRef(null);

    // --- 1. FETCH CONFIG ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("match-3");
                if (response.status === "success" && response.data?.config) {
                    const cfg = response.data.config;
                    setConfig(cfg);
                    setGameId(response.data.id);
                    setGridSize(cfg.cols || cfg.rows || 10);
                    const times = cfg.times || [5, 10, 20];
                    setTimeLeft(times[0] * 60);
                    setTotalGameTime(times[0] * 60);
                } else {
                    setConfig({ targetScore: DEFAULT_TARGET_SCORE, times: [5, 10, 20], cols: 10, rows: 10 });
                }
            } catch (error) {
                console.error("Failed to fetch match-3 config:", error);
                setConfig({ targetScore: DEFAULT_TARGET_SCORE, times: [5, 10, 20], cols: 10, rows: 10 });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // --- HELPERS ---
    const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    const createBoard = useCallback(() => {
        const size = gridSize;
        const newBoard = [];
        for (let row = 0; row < size; row++) {
            const rowArr = [];
            for (let col = 0; col < size; col++) {
                let color;
                do {
                    color = getRandomColor();
                } while (
                    (col >= 2 && rowArr[col - 1] === color && rowArr[col - 2] === color) ||
                    (row >= 2 && newBoard[row - 1]?.[col] === color && newBoard[row - 2]?.[col] === color)
                );
                rowArr.push(color);
            }
            newBoard.push(rowArr);
        }
        return newBoard;
    }, [gridSize]);

    const findMatches = useCallback((boardState) => {
        const size = gridSize;
        const matches = new Set();

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size - 2; col++) {
                const color = boardState[row]?.[col];
                if (color && color === boardState[row]?.[col + 1] && color === boardState[row]?.[col + 2]) {
                    let len = 3;
                    while (col + len < size && boardState[row]?.[col + len] === color) len++;
                    for (let i = 0; i < len; i++) matches.add(`${row},${col + i}`);
                }
            }
        }

        for (let col = 0; col < size; col++) {
            for (let row = 0; row < size - 2; row++) {
                const color = boardState[row]?.[col];
                if (color && color === boardState[row + 1]?.[col] && color === boardState[row + 2]?.[col]) {
                    let len = 3;
                    while (row + len < size && boardState[row + len]?.[col] === color) len++;
                    for (let i = 0; i < len; i++) matches.add(`${row + i},${col}`);
                }
            }
        }

        return Array.from(matches).map(key => {
            const [r, c] = key.split(",").map(Number);
            return { row: r, col: c };
        });
    }, [gridSize]);

    const applyGravity = useCallback((boardState) => {
        const size = gridSize;
        const newBoard = boardState.map(row => [...row]);

        for (let col = 0; col < size; col++) {
            let writeRow = size - 1;
            for (let row = size - 1; row >= 0; row--) {
                if (newBoard[row]?.[col] !== null) {
                    newBoard[writeRow][col] = newBoard[row][col];
                    if (writeRow !== row) newBoard[row][col] = null;
                    writeRow--;
                }
            }
            for (let row = writeRow; row >= 0; row--) {
                newBoard[row][col] = getRandomColor();
            }
        }

        return newBoard;
    }, [gridSize]);

    const processMatches = useCallback(async (boardState, isPlayerMove = true, multiplier = 1) => {
        let currentBoard = boardState.map(row => [...row]);
        let totalScore = 0;
        let currentMultiplier = multiplier;

        while (true) {
            const matches = findMatches(currentBoard);
            if (matches.length === 0) break;

            setFlashingCells(matches);
            await new Promise(r => setTimeout(r, 200));
            setFlashingCells([]);

            const matchScore = matches.length * 10 * currentMultiplier;
            totalScore += matchScore;

            matches.forEach(({ row, col }) => {
                currentBoard[row][col] = null;
            });

            await new Promise(r => setTimeout(r, 100));
            currentBoard = applyGravity(currentBoard);
            setBoard([...currentBoard]);

            currentMultiplier++;
            setComboMultiplier(currentMultiplier);
            await new Promise(r => setTimeout(r, 150));
        }

        setComboMultiplier(1);

        if (totalScore > 0) {
            if (isPlayerMove) {
                setPlayerScore(prev => prev + totalScore);
            } else {
                setComputerScore(prev => prev + totalScore);
            }
        }

        return { board: currentBoard, score: totalScore };
    }, [findMatches, applyGravity]);

    // Find a valid hint move
    const findHintMove = useCallback(() => {
        const size = gridSize;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const neighbors = [
                    { row, col: col + 1 },
                    { row: row + 1, col },
                ].filter(n => n.row < size && n.col < size);

                for (const neighbor of neighbors) {
                    const testBoard = board.map(r => [...r]);
                    const t = testBoard[row][col];
                    testBoard[row][col] = testBoard[neighbor.row][neighbor.col];
                    testBoard[neighbor.row][neighbor.col] = t;

                    if (findMatches(testBoard).length > 0) {
                        return [
                            { row, col },
                            { row: neighbor.row, col: neighbor.col }
                        ];
                    }
                }
            }
        }
        return null;
    }, [board, findMatches, gridSize]);

    // --- INIT GAME ---
    const initGame = useCallback(async () => {
        setIsProcessing(true);
        let newBoard = createBoard();
        setBoard(newBoard);

        await new Promise(r => setTimeout(r, 300));
        const result = await processMatches(newBoard, false, 1);
        setBoard(result.board);

        setPlayerScore(0);
        setComputerScore(0);
        setSelectedPos(null);
        setHintCells([]);
        setIsProcessing(false);
    }, [createBoard, processMatches]);

    // --- START GAME ---
    const startGame = async (timeIndex) => {
        const times = config?.times || [5, 10, 20];
        setSelectedTimeOption(timeIndex);
        const gameTime = times[timeIndex] * 60;
        setTimeLeft(gameTime);
        setTotalGameTime(gameTime);
        setElapsedTime(0);
        setGameStatus("playing");
        setGameStarted(true);
        await initGame();
    };

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

            // In-game controls
            if (gameStatus === "playing") {
                switch (e.key) {
                    case "h":
                    case "H":
                        e.preventDefault();
                        // Hint inline - find valid swap and highlight only 2 cells
                        if (!isProcessing) {
                            const size = gridSize;
                            let foundHint = null;
                            for (let row = 0; row < size && !foundHint; row++) {
                                for (let col = 0; col < size && !foundHint; col++) {
                                    const neighbors = [
                                        { row, col: col + 1 },
                                        { row: row + 1, col },
                                    ].filter(n => n.row < size && n.col < size);

                                    for (const neighbor of neighbors) {
                                        const testBoard = board.map(r => [...r]);
                                        const t = testBoard[row][col];
                                        testBoard[row][col] = testBoard[neighbor.row][neighbor.col];
                                        testBoard[neighbor.row][neighbor.col] = t;

                                        if (findMatches(testBoard).length > 0) {
                                            foundHint = [
                                                { row, col },
                                                { row: neighbor.row, col: neighbor.col }
                                            ];
                                            break;
                                        }
                                    }
                                }
                            }
                            if (foundHint) {
                                setHintCells(foundHint);
                                setPlayerScore(prev => Math.max(0, prev - 20));
                                setTimeout(() => setHintCells([]), 3000);
                            }
                        }
                        break;
                    case "Escape":
                    case "Backspace":
                        e.preventDefault();
                        // Pause and show exit dialog
                        clearInterval(timerRef.current);
                        clearInterval(elapsedRef.current);
                        clearInterval(aiTimerRef.current);
                        setShowExitDialog(true);
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [loading, gameStarted, gameStatus, selectedTimeOption, config, navigate, isProcessing, board, findMatches, gridSize]);

    // Handle back from config screen (second back)
    const handleBackFromConfig = () => {
        if (board.length > 0 && playerScore > 0) {
            // Has progress, ask to save
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

    // --- TIMER ---
    useEffect(() => {
        if (!gameStarted || gameStatus !== "playing" || loading) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    clearInterval(aiTimerRef.current);
                    const targetScore = config?.targetScore || DEFAULT_TARGET_SCORE;
                    if (playerScore >= targetScore) {
                        setGameStatus("win");
                    } else {
                        setGameStatus("lose");
                    }
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
    }, [gameStarted, gameStatus, loading, playerScore, config]);

    // --- AI MOVES ---
    useEffect(() => {
        if (!gameStarted || gameStatus !== "playing" || loading || isProcessing) return;

        aiTimerRef.current = setInterval(async () => {
            if (isProcessing) return;

            const size = gridSize;
            const boardCopy = board.map(row => [...row]);
            let foundMove = false;

            for (let row = 0; row < size && !foundMove; row++) {
                for (let col = 0; col < size && !foundMove; col++) {
                    const neighbors = [
                        { row: row, col: col + 1 },
                        { row: row + 1, col: col },
                    ].filter(n => n.row < size && n.col < size);

                    for (const neighbor of neighbors) {
                        const temp = boardCopy[row][col];
                        boardCopy[row][col] = boardCopy[neighbor.row][neighbor.col];
                        boardCopy[neighbor.row][neighbor.col] = temp;

                        if (findMatches(boardCopy).length > 0) {
                            setIsProcessing(true);
                            const newBoard = board.map(r => [...r]);
                            const t = newBoard[row][col];
                            newBoard[row][col] = newBoard[neighbor.row][neighbor.col];
                            newBoard[neighbor.row][neighbor.col] = t;
                            setBoard(newBoard);

                            toast({
                                title: "Máy chơi",
                                description: "Máy vừa thực hiện một nước đi",
                                className: "bg-violet-600 border-none text-white"
                            });

                            await new Promise(r => setTimeout(r, 200));
                            await processMatches(newBoard, false, 1);
                            setIsProcessing(false);
                            foundMove = true;
                            break;
                        }

                        boardCopy[neighbor.row][neighbor.col] = boardCopy[row][col];
                        boardCopy[row][col] = temp;
                    }
                }
            }

            if (!foundMove) {
                setComputerScore(prev => prev + 30);
            }
        }, AI_MOVE_INTERVAL);

        return () => clearInterval(aiTimerRef.current);
    }, [gameStarted, gameStatus, loading, isProcessing, board, findMatches, processMatches, toast, gridSize]);

    // --- CHECK WIN ---
    useEffect(() => {
        if (gameStarted && gameStatus === "playing") {
            const targetScore = config?.targetScore || DEFAULT_TARGET_SCORE;
            if (playerScore >= targetScore) {
                setGameStatus("win");
                clearInterval(timerRef.current);
                clearInterval(aiTimerRef.current);
            }
        }
    }, [playerScore, gameStatus, gameStarted, config]);

    // --- SAVE HISTORY when game ends ---
    useEffect(() => {
        const saveHistory = async () => {
            if ((gameStatus === "win" || gameStatus === "lose") && gameId && gameStarted) {
                try {
                    await gameService.savePlayHistory({
                        game_id: gameId,
                        score: playerScore,
                        duration: elapsedTime
                    });
                } catch (error) {
                    console.error("Failed to save history:", error);
                }
            }
        };
        saveHistory();
    }, [gameStatus, gameId, playerScore, elapsedTime, gameStarted]);

    // --- CLICK ON CELL TO SELECT/SWAP ---
    const handleCellClick = useCallback(async (row, col) => {
        if (isProcessing || gameStatus !== "playing") return;

        // Clear hint cells on any click
        setHintCells([]);

        if (selectedPos === null) {
            setSelectedPos({ row, col });
        } else {
            // Try to swap
            const isAdjacent =
                (Math.abs(selectedPos.row - row) === 1 && selectedPos.col === col) ||
                (Math.abs(selectedPos.col - col) === 1 && selectedPos.row === row);

            if (!isAdjacent) {
                setInvalidSwap(true);
                setTimeout(() => setInvalidSwap(false), 300);
                setSelectedPos({ row, col });
                return;
            }

            setIsProcessing(true);

            const newBoard = board.map(r => [...r]);
            const temp = newBoard[selectedPos.row][selectedPos.col];
            newBoard[selectedPos.row][selectedPos.col] = newBoard[row][col];
            newBoard[row][col] = temp;

            const matches = findMatches(newBoard);

            if (matches.length === 0) {
                setBoard(newBoard);
                setInvalidSwap(true);
                await new Promise(r => setTimeout(r, 200));

                newBoard[row][col] = newBoard[selectedPos.row][selectedPos.col];
                newBoard[selectedPos.row][selectedPos.col] = temp;
                setBoard(newBoard);

                setTimeout(() => setInvalidSwap(false), 200);
                setIsProcessing(false);
                setSelectedPos(null);
                return;
            }

            setBoard(newBoard);
            setSelectedPos(null);
            await new Promise(r => setTimeout(r, 100));
            await processMatches(newBoard, true, 1);
            setIsProcessing(false);
        }
    }, [board, selectedPos, findMatches, processMatches, isProcessing, gameStatus]);

    // --- 5 CONTROL BUTTONS HANDLERS ---

    // 1. Left - Navigate time options (config) or no action (game)
    const handleLeft = () => {
        if (!gameStarted) {
            const times = config?.times || [5, 10, 20];
            setSelectedTimeOption(prev => Math.max(0, prev - 1));
        }
    };

    // 2. Right - Navigate time options (config) or no action (game)
    const handleRight = () => {
        if (!gameStarted) {
            const times = config?.times || [5, 10, 20];
            setSelectedTimeOption(prev => Math.min(times.length - 1, prev + 1));
        }
    };

    // 3. Enter - Start game (config) or no action (game)
    const handleEnter = () => {
        if (!gameStarted) {
            startGame(selectedTimeOption);
        }
    };

    // 4. Back - Pause and show exit dialog
    const handleBack = () => {
        if (gameStarted && gameStatus === "playing") {
            // Pause the game and show exit dialog
            clearInterval(timerRef.current);
            clearInterval(elapsedRef.current);
            clearInterval(aiTimerRef.current);
            setShowExitDialog(true);
        } else if (!gameStarted) {
            // On config screen: ask to save and go home
            handleBackFromConfig();
        }
    };

    // Handle exit with save from gameplay
    const handleExitGameWithSave = async () => {
        await handleSave();
        setShowExitDialog(false);
        setGameStarted(false);
        setGameStatus("playing");
    };

    // Handle exit without save from gameplay
    const handleExitGameWithoutSave = () => {
        setShowExitDialog(false);
        setGameStarted(false);
        setGameStatus("playing");
    };

    // Handle cancel exit (resume game)
    const handleCancelExit = () => {
        setShowExitDialog(false);
        // Resume timers if game was in progress
        if (gameStarted && gameStatus === "playing") {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        clearInterval(aiTimerRef.current);
                        const targetScore = config?.targetScore || DEFAULT_TARGET_SCORE;
                        if (playerScore >= targetScore) {
                            setGameStatus("win");
                        } else {
                            setGameStatus("lose");
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            elapsedRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

            // Resume AI timer
            aiTimerRef.current = setInterval(async () => {
                // AI move logic will be handled by useEffect
            }, AI_MOVE_INTERVAL);
        }
    };

    // 5. Hint - Show instructions (config) or highlight hint cells (game)
    const handleHint = () => {
        if (!gameStarted) {
            setShowInstructions(true);
            return;
        }

        if (isProcessing || gameStatus !== "playing") return;

        const hint = findHintMove();
        if (hint) {
            setHintCells(hint);
            setPlayerScore(prev => Math.max(0, prev - 20));
            toast({
                title: "💡 Gợi ý! (-20 điểm)",
                description: "2 ô đang nhấp nháy có thể hoán đổi",
                className: "bg-yellow-600 border-none text-white"
            });

            // Clear hint after 3 seconds
            setTimeout(() => setHintCells([]), 3000);
        } else {
            toast({
                title: "Không tìm thấy!",
                description: "Không có nước đi hợp lệ",
                variant: "destructive"
            });
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
                    board,
                    playerScore,
                    computerScore,
                    timeLeft,
                    totalGameTime
                }),
                current_score: playerScore,
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

    // Load game
    const handleLoad = async () => {
        if (!gameId) return;
        setIsLoadingSession(true);
        try {
            const response = await gameService.getLastSession(gameId);
            if (response.status === "success" && response.data) {
                const session = response.data;
                const state = JSON.parse(session.matrix_state);

                setBoard(state.board);
                setPlayerScore(state.playerScore || 0);
                setComputerScore(state.computerScore || 0);

                // Restore timer correctly
                const savedTimeLeft = state.timeLeft || (state.totalGameTime - session.elapsed_time) || 300;
                setTimeLeft(savedTimeLeft);
                setTotalGameTime(state.totalGameTime || savedTimeLeft);
                setElapsedTime(session.elapsed_time || 0);

                setGameStarted(true);
                setGameStatus("playing");

                toast({
                    title: "📥 Đã load game!",
                    description: `Điểm: ${state.playerScore} | Thời gian còn: ${Math.floor(savedTimeLeft / 60)}:${String(savedTimeLeft % 60).padStart(2, '0')}`,
                    className: "bg-teal-600 border-none text-white"
                });
            }
        } catch (error) {
            toast({ title: "Thông báo", description: "Không tìm thấy game đã lưu", variant: "default" });
        } finally {
            setIsLoadingSession(false);
        }
    };

    // --- LOADING STATE ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_MATCH3_ENGINE...</span>
        </div>
    );

    const times = config?.times || [5, 10, 20];
    const targetScore = config?.targetScore || DEFAULT_TARGET_SCORE;

    // --- TIME SELECTION SCREEN ---
    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl" ref={containerRef}>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-3">
                        <Zap className="w-10 h-10 text-violet-400" />
                        MATCH 3
                    </h2>
                    <p className="text-slate-400 text-sm">Click để chọn, click ô kề để swap</p>

                </div>

                <div className="flex gap-4 items-center">
                    {times.map((t, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedTimeOption(idx)}
                            className={cn(
                                "px-8 py-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
                                selectedTimeOption === idx
                                    ? "bg-violet-500/20 border-violet-500 scale-110 shadow-lg shadow-violet-500/30"
                                    : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                            )}
                        >
                            <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-violet-400" : "text-slate-400")} />
                            <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-violet-400" : "text-slate-300")}>
                                {t} phút
                            </span>
                        </button>
                    ))}
                </div>



                {/* Load button */}
                <Button
                    onClick={handleLoad}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 rounded-xl"
                    disabled={isLoadingSession}
                >
                    {isLoadingSession ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Tiếp tục game đã lưu
                </Button>

                {/* Instructions Dialog */}
                <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
                    <AlertDialogContent className="bg-slate-900 border-slate-700">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-yellow-400" />
                                Hướng dẫn chơi Match 3
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-3 text-slate-300">
                                    {GAME_INSTRUCTIONS.map((instruction, idx) => (
                                        <p key={idx} className="text-sm">{instruction}</p>
                                    ))}
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction className="bg-violet-600 hover:bg-violet-500">
                                Đã hiểu
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Exit Dialog */}
                <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                    <AlertDialogContent className="bg-slate-900 border-slate-700">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Lưu game trước khi thoát?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có muốn lưu tiến trình game hiện tại không?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleExitWithoutSave} className="bg-slate-800 text-white hover:bg-slate-700">
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

            {/* Score Bars */}
            <div className="w-full max-w-2xl grid grid-cols-2 gap-4">
                <ScoreBar
                    label="Điểm số của tôi"
                    score={playerScore}
                    target={targetScore}
                    icon={<User className="w-4 h-4" />}
                    color="emerald"
                />
                <ScoreBar
                    label="Điểm số của máy"
                    score={computerScore}
                    target={targetScore}
                    icon={<Cpu className="w-4 h-4" />}
                    color="rose"
                />
            </div>

            {/* Timer & Info */}
            <div className="flex items-center gap-4 bg-slate-900/60 px-6 py-2 rounded-full border border-white/10">
                <div className={cn("flex items-center gap-2", timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400")}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold text-lg">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2 text-violet-400">
                    <Target className="w-4 h-4" />
                    <span className="font-mono text-sm">MỤC TIÊU: {targetScore} điểm</span>
                </div>
                {comboMultiplier > 1 && (
                    <>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                            <Zap className="w-4 h-4" />
                            <span className="font-bold">x{comboMultiplier} COMBO!</span>
                        </div>
                    </>
                )}
            </div>


            {/* Game Board */}
            <div className="relative">
                <div className={cn(
                    "absolute -inset-3 rounded-3xl blur-2xl transition-all duration-500",
                    gameStatus === "win" && "bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 animate-pulse",
                    gameStatus === "lose" && "bg-rose-500/30",
                    gameStatus === "playing" && "bg-violet-500/10"
                )} />

                <div
                    className={cn(
                        "relative grid gap-1 p-3 bg-slate-950 rounded-2xl border-4 shadow-2xl ring-1 ring-white/5 transition-all",
                        invalidSwap && "border-rose-500 animate-shake",
                        !invalidSwap && "border-slate-800"
                    )}
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        width: 'min(90vw, 65vh)',
                        aspectRatio: '1/1'
                    }}
                >
                    {board.flatMap((row, rowIdx) =>
                        row.map((color, colIdx) => {
                            const isSelected = selectedPos?.row === rowIdx && selectedPos?.col === colIdx;
                            const isFlashing = flashingCells.some(c => c.row === rowIdx && c.col === colIdx);
                            const isHinted = hintCells.some(c => c.row === rowIdx && c.col === colIdx);

                            return (
                                <div
                                    key={`${rowIdx}-${colIdx}`}
                                    onClick={() => handleCellClick(rowIdx, colIdx)}
                                    className={cn(
                                        "rounded-md transition-all duration-150 relative cursor-pointer",
                                        color && COLOR_CLASSES[color],
                                        color && "shadow-lg",
                                        isSelected && "ring-4 ring-yellow-400 scale-110 z-30",
                                        isFlashing && "!bg-white !shadow-white/80 scale-125 z-40",
                                        isHinted && "ring-8 ring-amber-500 z-10 shadow-lg",
                                        !color && "bg-slate-800/30"
                                    )}
                                />
                            );
                        })
                    )}

                    {/* Win Overlay */}
                    {gameStatus === "win" && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-50 animate-in fade-in zoom-in">
                            <div className="p-8 bg-gradient-to-br from-emerald-900/90 to-teal-900/90 border border-emerald-500/50 rounded-3xl shadow-2xl flex flex-col items-center">
                                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                    <Trophy className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                    VICTORY!
                                </h2>
                                <p className="text-emerald-300 text-sm mb-6 font-mono">SCORE: {playerScore} | TIME: {elapsedTime}s</p>
                                <Button
                                    onClick={() => { setGameStarted(false); setGameStatus("playing"); }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl"
                                >
                                    CHƠI LẠI
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Lose Overlay */}
                    {gameStatus === "lose" && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-50 animate-in fade-in zoom-in">
                            <div className="p-8 bg-gradient-to-br from-rose-900/90 to-red-900/90 border border-rose-500/50 rounded-3xl shadow-2xl flex flex-col items-center">
                                <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Frown className="w-12 h-12 text-rose-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">HẾT GIỜ!</h2>
                                <p className="text-rose-300 text-sm mb-6 font-mono">SCORE: {playerScore} / {targetScore}</p>
                                <Button
                                    onClick={() => { setGameStarted(false); setGameStatus("playing"); }}
                                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-2xl"
                                >
                                    THỬ LẠI
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Game Button */}
            <Button
                onClick={handleSave}
                disabled={isSaving || !gameStarted || gameStatus !== "playing"}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
            >
                {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Save className="w-5 h-5" />
                )}
                {isSaving ? "Đang lưu..." : "Lưu Game"}
            </Button>

            {/* Exit Dialog */}
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

function ScoreBar({ label, score, target, icon, color }) {
    const percentage = Math.min((score / target) * 100, 100);
    const colorClasses = {
        emerald: "from-emerald-600 to-emerald-400 text-emerald-400",
        rose: "from-rose-600 to-rose-400 text-rose-400"
    };

    return (
        <div className="bg-slate-900/60 border border-white/5 p-3 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
                <div className={cn("flex items-center gap-2 text-xs font-bold", colorClasses[color].split(" ")[2])}>
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-mono font-bold text-white">{score}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full bg-gradient-to-r transition-all duration-300", colorClasses[color])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
