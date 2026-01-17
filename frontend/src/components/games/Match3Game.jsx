import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Trophy, Frown, Zap, Clock, Target, User, Cpu, Save, Download, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";

const GRID_SIZE = 10;
const COLORS = ["red", "green", "blue", "yellow", "purple"];
const COLOR_CLASSES = {
    red: "bg-rose-500 shadow-rose-500/50",
    green: "bg-emerald-500 shadow-emerald-500/50",
    blue: "bg-sky-500 shadow-sky-500/50",
    yellow: "bg-amber-400 shadow-amber-400/50",
    purple: "bg-violet-500 shadow-violet-500/50",
};
const TARGET_SCORE = 3000;
const GAME_TIME = 120;
const AI_MOVE_INTERVAL = 3000;

export default function Match3Game() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [gameId, setGameId] = useState(null);

    const [board, setBoard] = useState([]);
    const [cursorPos, setCursorPos] = useState({ row: 0, col: 0 });
    const [selectedPos, setSelectedPos] = useState(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [computerScore, setComputerScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [comboMultiplier, setComboMultiplier] = useState(1);
    const [flashingCells, setFlashingCells] = useState([]);
    const [invalidSwap, setInvalidSwap] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);

    // Game state flags
    const [selectedTimeOption, setSelectedTimeOption] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameStatus, setGameStatus] = useState("playing"); // playing, win, lose
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);

    const timerRef = useRef();
    const elapsedRef = useRef();
    const aiTimerRef = useRef();

    // --- 1. FETCH CONFIG ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("match-3");
                if (response.status === "success" && response.data?.config) {
                    setConfig(response.data.config);
                    setGameId(response.data.id);
                    const times = response.data.config.times || [1, 2, 3];
                    setTimeLeft(times[0] * 60);
                } else {
                    setConfig({ targetScore: TARGET_SCORE, times: [1, 2, 3] });
                }
            } catch (error) {
                console.error("Failed to fetch match-3 config:", error);
                setConfig({ targetScore: TARGET_SCORE, times: [1, 2, 3] });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // --- HELPERS ---
    const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    const createBoard = useCallback(() => {
        const newBoard = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            const rowArr = [];
            for (let col = 0; col < GRID_SIZE; col++) {
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
    }, []);

    const findMatches = useCallback((boardState) => {
        const matches = new Set();

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE - 2; col++) {
                const color = boardState[row][col];
                if (color && color === boardState[row][col + 1] && color === boardState[row][col + 2]) {
                    let len = 3;
                    while (col + len < GRID_SIZE && boardState[row][col + len] === color) len++;
                    for (let i = 0; i < len; i++) matches.add(`${row},${col + i}`);
                }
            }
        }

        for (let col = 0; col < GRID_SIZE; col++) {
            for (let row = 0; row < GRID_SIZE - 2; row++) {
                const color = boardState[row][col];
                if (color && color === boardState[row + 1]?.[col] && color === boardState[row + 2]?.[col]) {
                    let len = 3;
                    while (row + len < GRID_SIZE && boardState[row + len]?.[col] === color) len++;
                    for (let i = 0; i < len; i++) matches.add(`${row + i},${col}`);
                }
            }
        }

        return Array.from(matches).map(key => {
            const [r, c] = key.split(",").map(Number);
            return { row: r, col: c };
        });
    }, []);

    const applyGravity = useCallback((boardState) => {
        const newBoard = boardState.map(row => [...row]);

        for (let col = 0; col < GRID_SIZE; col++) {
            let writeRow = GRID_SIZE - 1;
            for (let row = GRID_SIZE - 1; row >= 0; row--) {
                if (newBoard[row][col] !== null) {
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
    }, []);

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
        setCursorPos({ row: 0, col: 0 });
        setSelectedPos(null);
        setHintsUsed(0);
        setIsProcessing(false);
    }, [createBoard, processMatches]);

    // --- START GAME ---
    const startGame = async (timeIndex) => {
        const times = config?.times || [1, 2, 3];
        setSelectedTimeOption(timeIndex);
        setTimeLeft(times[timeIndex] * 60);
        setElapsedTime(0);
        setGameStatus("playing");
        setGameStarted(true);
        await initGame();
    };

    // --- TIMER ---
    useEffect(() => {
        if (!gameStarted || gameStatus !== "playing" || loading) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    clearInterval(aiTimerRef.current);
                    if (playerScore >= (config?.targetScore || TARGET_SCORE)) {
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

            const boardCopy = board.map(row => [...row]);
            let foundMove = false;

            for (let row = 0; row < GRID_SIZE && !foundMove; row++) {
                for (let col = 0; col < GRID_SIZE && !foundMove; col++) {
                    const neighbors = [
                        { row: row, col: col + 1 },
                        { row: row + 1, col: col },
                    ].filter(n => n.row < GRID_SIZE && n.col < GRID_SIZE);

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
                                title: "CPU Move!",
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
    }, [gameStarted, gameStatus, loading, isProcessing, board, findMatches, processMatches, toast]);

    // --- CHECK WIN ---
    useEffect(() => {
        if (gameStarted && gameStatus === "playing" && playerScore >= (config?.targetScore || TARGET_SCORE)) {
            setGameStatus("win");
            clearInterval(timerRef.current);
            clearInterval(aiTimerRef.current);
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
                    toast({
                        title: "Đã lưu kết quả!",
                        description: `Điểm: ${playerScore}`,
                        className: "bg-violet-600 border-none text-white"
                    });
                } catch (error) {
                    console.error("Failed to save history:", error);
                }
            }
        };
        saveHistory();
    }, [gameStatus, gameId, playerScore, elapsedTime, gameStarted, toast]);

    // --- SWAP LOGIC ---
    const trySwap = useCallback(async (pos1, pos2) => {
        if (isProcessing) return;

        const isAdjacent =
            (Math.abs(pos1.row - pos2.row) === 1 && pos1.col === pos2.col) ||
            (Math.abs(pos1.col - pos2.col) === 1 && pos1.row === pos2.row);

        if (!isAdjacent) {
            setInvalidSwap(true);
            setTimeout(() => setInvalidSwap(false), 300);
            setSelectedPos(null);
            return;
        }

        setIsProcessing(true);

        const newBoard = board.map(row => [...row]);
        const temp = newBoard[pos1.row][pos1.col];
        newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col];
        newBoard[pos2.row][pos2.col] = temp;

        const matches = findMatches(newBoard);

        if (matches.length === 0) {
            setBoard(newBoard);
            setInvalidSwap(true);
            await new Promise(r => setTimeout(r, 200));

            newBoard[pos2.row][pos2.col] = newBoard[pos1.row][pos1.col];
            newBoard[pos1.row][pos1.col] = temp;
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
    }, [board, findMatches, processMatches, isProcessing]);

    // --- HINT ---
    const handleHint = useCallback(() => {
        if (isProcessing) return;

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const neighbors = [
                    { row, col: col + 1 },
                    { row: row + 1, col },
                ].filter(n => n.row < GRID_SIZE && n.col < GRID_SIZE);

                for (const neighbor of neighbors) {
                    const testBoard = board.map(r => [...r]);
                    const t = testBoard[row][col];
                    testBoard[row][col] = testBoard[neighbor.row][neighbor.col];
                    testBoard[neighbor.row][neighbor.col] = t;

                    if (findMatches(testBoard).length > 0) {
                        setCursorPos({ row, col });
                        setHintsUsed(prev => prev + 1);
                        setPlayerScore(prev => Math.max(0, prev - 20));
                        toast({
                            title: "Gợi ý! (-20 điểm)",
                            description: `Thử tráo ô (${row + 1}, ${col + 1})`,
                            className: "bg-yellow-600 border-none text-white"
                        });
                        return;
                    }
                }
            }
        }
        toast({
            title: "Không tìm thấy!",
            description: "Không có nước đi hợp lệ",
            variant: "destructive"
        });
    }, [board, findMatches, isProcessing, toast]);

    // --- SAVE GAME SESSION ---
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
                    hintsUsed
                }),
                current_score: playerScore,
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

                setBoard(state.board);
                setPlayerScore(state.playerScore || 0);
                setComputerScore(state.computerScore || 0);
                setHintsUsed(state.hintsUsed || 0);
                setElapsedTime(session.elapsed_time || 0);
                setGameStarted(true);
                setGameStatus("playing");

                toast({
                    title: "Đã load game!",
                    description: `Điểm hiện tại: ${state.playerScore}`,
                    className: "bg-teal-600 border-none text-white"
                });
            }
        } catch (error) {
            toast({ title: "Thông báo", description: "Không tìm thấy game đã lưu", variant: "default" });
        } finally {
            setIsLoadingSession(false);
        }
    };

    // --- CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (loading || isProcessing) return;

        // Time selection screen
        if (!gameStarted) {
            const times = config?.times || [1, 2, 3];
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

        // Game ended
        if (gameStatus !== "playing") {
            if (e.key === "Enter") {
                setGameStarted(false);
                setGameStatus("playing");
            }
            if (e.key === "Escape") navigate("/home");
            return;
        }

        // During gameplay
        switch (e.key) {
            case "ArrowRight":
                setCursorPos(prev => ({ row: prev.row, col: (prev.col + 1) % GRID_SIZE }));
                break;
            case "ArrowLeft":
                setCursorPos(prev => ({ row: prev.row, col: (prev.col - 1 + GRID_SIZE) % GRID_SIZE }));
                break;
            case "ArrowDown":
                setCursorPos(prev => ({ row: (prev.row + 1) % GRID_SIZE, col: prev.col }));
                break;
            case "ArrowUp":
                setCursorPos(prev => ({ row: (prev.row - 1 + GRID_SIZE) % GRID_SIZE, col: prev.col }));
                break;
            case "Enter":
                if (selectedPos === null) {
                    setSelectedPos({ ...cursorPos });
                } else {
                    trySwap(selectedPos, cursorPos);
                }
                break;
            case "Escape":
                if (selectedPos) {
                    setSelectedPos(null);
                } else {
                    handleSave();
                    navigate("/home");
                }
                break;
            case "h": case "H":
                handleHint();
                break;
            case "s": case "S":
                handleSave();
                break;
        }
    }, [loading, isProcessing, gameStarted, gameStatus, cursorPos, selectedPos, config, selectedTimeOption, trySwap, handleHint, handleSave, handleLoad, navigate, startGame]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // --- LOADING STATE ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_MATCH3_ENGINE...</span>
        </div>
    );

    const times = config?.times || [1, 2, 3];
    const targetScore = config?.targetScore || TARGET_SCORE;

    // --- TIME SELECTION SCREEN ---
    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-3">
                        <Zap className="w-10 h-10 text-violet-400" />
                        MATCH 3
                    </h2>
                    <p className="text-slate-400 text-sm">Ghép 3 viên kẹo cùng màu để ghi điểm</p>
                </div>

                <div className="flex gap-4">
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

                <div className="flex gap-4">
                    <Button
                        onClick={() => startGame(selectedTimeOption)}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
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

    // --- MAIN GAME SCREEN ---
    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-5xl h-full px-4 py-2 justify-center">

            {/* Score Bars */}
            <div className="w-full max-w-2xl grid grid-cols-2 gap-4">
                <ScoreBar
                    label="PLAYER"
                    score={playerScore}
                    target={targetScore}
                    icon={<User className="w-4 h-4" />}
                    color="emerald"
                />
                <ScoreBar
                    label="CPU"
                    score={computerScore}
                    target={targetScore}
                    icon={<Cpu className="w-4 h-4" />}
                    color="rose"
                />
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-4 bg-slate-900/60 px-6 py-2 rounded-full border border-white/10">
                <div className={cn("flex items-center gap-2", timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400")}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold text-lg">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2 text-violet-400">
                    <Target className="w-4 h-4" />
                    <span className="font-mono text-sm">TARGET: {targetScore}</span>
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
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={handleHint} disabled={isProcessing}
                        className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/20">
                        <Lightbulb className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}
                        className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-500/20">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    </Button>
                </div>
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
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        width: 'min(90vw, 65vh)',
                        aspectRatio: '1/1'
                    }}
                >
                    {board.flatMap((row, rowIdx) =>
                        row.map((color, colIdx) => {
                            const isCursor = cursorPos.row === rowIdx && cursorPos.col === colIdx;
                            const isSelected = selectedPos?.row === rowIdx && selectedPos?.col === colIdx;
                            const isFlashing = flashingCells.some(c => c.row === rowIdx && c.col === colIdx);

                            return (
                                <div
                                    key={`${rowIdx}-${colIdx}`}
                                    onClick={() => {
                                        if (isProcessing) return;
                                        if (selectedPos === null) {
                                            setSelectedPos({ row: rowIdx, col: colIdx });
                                        } else {
                                            trySwap(selectedPos, { row: rowIdx, col: colIdx });
                                        }
                                    }}
                                    className={cn(
                                        "rounded-md transition-all duration-150 relative cursor-pointer",
                                        color && COLOR_CLASSES[color],
                                        color && "shadow-lg",
                                        isCursor && "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 z-20",
                                        isSelected && "animate-pulse ring-4 ring-yellow-400 scale-115 z-30",
                                        isFlashing && "!bg-white !shadow-white/80 scale-125 z-40",
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
                                    PLAY AGAIN
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
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">TIME'S UP!</h2>
                                <p className="text-rose-300 text-sm mb-6 font-mono">SCORE: {playerScore} / {targetScore}</p>
                                <Button
                                    onClick={() => { setGameStarted(false); setGameStatus("playing"); }}
                                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-2xl"
                                >
                                    TRY AGAIN
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-300", colorClasses[color])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
