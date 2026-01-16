import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Trophy, Frown, Zap, Clock, Target, User, Cpu } from "lucide-react";
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
const TARGET_SCORE = 1000;
const GAME_TIME = 120; // seconds
const AI_MOVE_INTERVAL = 15000; // 15 seconds

export default function Match3Game() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [board, setBoard] = useState([]);
    const [cursorPos, setCursorPos] = useState({ row: 0, col: 0 });
    const [selectedPos, setSelectedPos] = useState(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [computerScore, setComputerScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [gameStatus, setGameStatus] = useState("playing"); // playing, win, lose
    const [isProcessing, setIsProcessing] = useState(false);
    const [comboMultiplier, setComboMultiplier] = useState(1);
    const [flashingCells, setFlashingCells] = useState([]);
    const [invalidSwap, setInvalidSwap] = useState(false);

    const timerRef = useRef();
    const aiTimerRef = useRef();

    // --- 1. FETCH CONFIG ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("match-3");
                if (response.status === "success" && response.data?.config) {
                    setConfig(response.data.config);
                } else {
                    setConfig({ targetScore: TARGET_SCORE, gameTime: GAME_TIME });
                }
            } catch (error) {
                console.error("Failed to fetch match-3 config:", error);
                setConfig({ targetScore: TARGET_SCORE, gameTime: GAME_TIME });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // --- HELPER: Generate random color ---
    const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    // --- HELPER: Create initial board ---
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

    // --- HELPER: Find all matches on the board ---
    const findMatches = useCallback((boardState) => {
        const matches = new Set();

        // Check horizontal matches
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

        // Check vertical matches
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

    // --- HELPER: Apply gravity and fill ---
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
            // Fill empty cells at top
            for (let row = writeRow; row >= 0; row--) {
                newBoard[row][col] = getRandomColor();
            }
        }

        return newBoard;
    }, []);

    // --- PROCESS MATCHES (with cascade) ---
    const processMatches = useCallback(async (boardState, isPlayerMove = true, multiplier = 1) => {
        let currentBoard = boardState.map(row => [...row]);
        let totalScore = 0;
        let currentMultiplier = multiplier;

        while (true) {
            const matches = findMatches(currentBoard);
            if (matches.length === 0) break;

            // Flash matched cells
            setFlashingCells(matches);
            await new Promise(r => setTimeout(r, 200));
            setFlashingCells([]);

            // Calculate score
            const matchScore = matches.length * 10 * currentMultiplier;
            totalScore += matchScore;

            // Clear matched cells
            matches.forEach(({ row, col }) => {
                currentBoard[row][col] = null;
            });

            // Apply gravity
            await new Promise(r => setTimeout(r, 100));
            currentBoard = applyGravity(currentBoard);
            setBoard([...currentBoard]);

            // Increase multiplier for combos
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

    // --- INITIALIZE GAME ---
    const initGame = useCallback(async () => {
        setIsProcessing(true);
        let newBoard = createBoard();
        setBoard(newBoard);

        // Clear any initial matches
        await new Promise(r => setTimeout(r, 300));
        const result = await processMatches(newBoard, false, 1);
        setBoard(result.board);

        setPlayerScore(0);
        setComputerScore(0);
        setTimeLeft(config?.gameTime || GAME_TIME);
        setGameStatus("playing");
        setCursorPos({ row: 0, col: 0 });
        setSelectedPos(null);
        setIsProcessing(false);
    }, [createBoard, processMatches, config]);

    useEffect(() => {
        if (!loading && config) {
            initGame();
        }
    }, [loading, config, initGame]);

    // --- TIMER ---
    useEffect(() => {
        if (gameStatus !== "playing" || loading) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
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

        return () => clearInterval(timerRef.current);
    }, [gameStatus, loading, playerScore, config]);

    // --- AI MOVES ---
    useEffect(() => {
        if (gameStatus !== "playing" || loading || isProcessing) return;

        aiTimerRef.current = setInterval(async () => {
            if (isProcessing) return;

            // Find a valid move for AI
            const boardCopy = board.map(row => [...row]);
            let foundMove = false;

            for (let row = 0; row < GRID_SIZE && !foundMove; row++) {
                for (let col = 0; col < GRID_SIZE && !foundMove; col++) {
                    const neighbors = [
                        { row: row, col: col + 1 },
                        { row: row + 1, col: col },
                    ].filter(n => n.row < GRID_SIZE && n.col < GRID_SIZE);

                    for (const neighbor of neighbors) {
                        // Try swap
                        const temp = boardCopy[row][col];
                        boardCopy[row][col] = boardCopy[neighbor.row][neighbor.col];
                        boardCopy[neighbor.row][neighbor.col] = temp;

                        if (findMatches(boardCopy).length > 0) {
                            // Valid move found, execute it
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

                        // Undo swap
                        boardCopy[neighbor.row][neighbor.col] = boardCopy[row][col];
                        boardCopy[row][col] = temp;
                    }
                }
            }

            if (!foundMove) {
                // No valid move, give AI some points anyway
                setComputerScore(prev => prev + 30);
            }
        }, AI_MOVE_INTERVAL);

        return () => clearInterval(aiTimerRef.current);
    }, [gameStatus, loading, isProcessing, board, findMatches, processMatches, toast]);

    // --- CHECK WIN CONDITION ---
    useEffect(() => {
        if (gameStatus === "playing" && playerScore >= (config?.targetScore || TARGET_SCORE)) {
            setGameStatus("win");
            clearInterval(timerRef.current);
            clearInterval(aiTimerRef.current);
        }
    }, [playerScore, gameStatus, config]);

    // --- SWAP LOGIC ---
    const trySwap = useCallback(async (pos1, pos2) => {
        if (isProcessing) return;

        // Check if adjacent
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

        // Perform swap
        const newBoard = board.map(row => [...row]);
        const temp = newBoard[pos1.row][pos1.col];
        newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col];
        newBoard[pos2.row][pos2.col] = temp;

        // Check if valid (creates match)
        const matches = findMatches(newBoard);

        if (matches.length === 0) {
            // Invalid swap - animate back
            setBoard(newBoard);
            setInvalidSwap(true);
            await new Promise(r => setTimeout(r, 200));

            // Swap back
            newBoard[pos2.row][pos2.col] = newBoard[pos1.row][pos1.col];
            newBoard[pos1.row][pos1.col] = temp;
            setBoard(newBoard);

            setTimeout(() => setInvalidSwap(false), 200);
            setIsProcessing(false);
            setSelectedPos(null);
            return;
        }

        // Valid swap
        setBoard(newBoard);
        setSelectedPos(null);
        await new Promise(r => setTimeout(r, 100));
        await processMatches(newBoard, true, 1);
        setIsProcessing(false);
    }, [board, findMatches, processMatches, isProcessing]);

    // --- CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (loading || isProcessing) return;

        if (gameStatus !== "playing") {
            if (e.key === "Enter") initGame();
            if (e.key === "Escape") navigate("/home");
            return;
        }

        switch (e.key) {
            case "ArrowRight":
                setCursorPos(prev => ({
                    row: prev.row,
                    col: (prev.col + 1) % GRID_SIZE
                }));
                break;
            case "ArrowLeft":
                setCursorPos(prev => ({
                    row: prev.row,
                    col: (prev.col - 1 + GRID_SIZE) % GRID_SIZE
                }));
                break;
            case "ArrowDown":
                setCursorPos(prev => ({
                    row: (prev.row + 1) % GRID_SIZE,
                    col: prev.col
                }));
                break;
            case "ArrowUp":
                setCursorPos(prev => ({
                    row: (prev.row - 1 + GRID_SIZE) % GRID_SIZE,
                    col: prev.col
                }));
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
                    navigate("/home");
                }
                break;
            case "h": case "H":
                // Hint: Find a valid move
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
                                toast({
                                    title: "Gợi ý!",
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
                break;
        }
    }, [loading, isProcessing, gameStatus, cursorPos, selectedPos, trySwap, board, findMatches, initGame, navigate, toast]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_MATCH3_ENGINE...</span>
        </div>
    );

    const targetScore = config?.targetScore || TARGET_SCORE;

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-4">

            {/* Score Bars */}
            <div className="w-full grid grid-cols-2 gap-4">
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

            {/* Timer & Combo */}
            <div className="flex items-center gap-6 bg-slate-900/60 px-6 py-2 rounded-full border border-white/10">
                <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold text-lg">{String(timeLeft).padStart(3, '0')}s</span>
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
                        width: 'min(85vw, 450px)',
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
                                    className={cn(
                                        "rounded-md transition-all duration-150 relative",
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
                                <p className="text-emerald-300 text-sm mb-6 font-mono">SCORE: {playerScore}</p>
                                <Button
                                    onClick={initGame}
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
                                    onClick={initGame}
                                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-2xl"
                                >
                                    TRY AGAIN
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Guide */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-[10px]">
                <ControlHint keys={["←", "→", "↑", "↓"]} label="MOVE" />
                <div className="w-px h-6 bg-white/10" />
                <ControlHint keys={["ENT"]} label="SELECT/SWAP" />
                <div className="w-px h-6 bg-white/10" />
                <ControlHint keys={["H"]} label="HINT" />
                <div className="w-px h-6 bg-white/10" />
                <ControlHint keys={["ESC"]} label="CANCEL/BACK" />
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

function ControlHint({ keys, label }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-1.5 py-0.5 bg-slate-950 border border-white/10 rounded text-[9px] font-bold text-slate-300">
                        {k}
                    </kbd>
                ))}
            </div>
            <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase">{label}</span>
        </div>
    );
}
