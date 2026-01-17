import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Trophy, Frown, Target, Zap, Info, Clock, Save, Download, User, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";

const GRID_SIZE = 15;
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

export default function SnakeGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [gameId, setGameId] = useState(null);

    const [playerSnake, setPlayerSnake] = useState(INITIAL_PLAYER_SNAKE);
    const [cpuSnake, setCpuSnake] = useState(INITIAL_CPU_SNAKE);
    const [food, setFood] = useState({ x: 7, y: 7 });
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [cpuDirection, setCpuDirection] = useState({ x: -1, y: 0 });
    const [score, setScore] = useState(0);
    const [isBoosting, setIsBoosting] = useState(false);
    const [hintSteps, setHintSteps] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Timer & Game state
    const [selectedTimeOption, setSelectedTimeOption] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);

    const gameLoopRef = useRef();
    const directionRef = useRef(INITIAL_DIRECTION);
    const cpuDirectionRef = useRef({ x: -1, y: 0 });
    const timerRef = useRef();
    const elapsedRef = useRef();

    // --- 1. FETCH CONFIG ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("snake");
                if (response.status === "success" && response.data?.config) {
                    setConfig(response.data.config);
                    setGameId(response.data.id);
                    const times = response.data.config.times || [1, 2, 3];
                    setTimeLeft(times[0] * 60);
                } else {
                    setConfig({ speed: 150, times: [1, 2, 3] });
                }
            } catch (error) {
                console.error("Failed to fetch snake config:", error);
                setConfig({ speed: 150, times: [1, 2, 3] });
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
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            const isOnPlayer = pSnake.some(s => s.x === newFood.x && s.y === newFood.y);
            const isOnCpu = cSnake.some(s => s.x === newFood.x && s.y === newFood.y);
            if (!isOnPlayer && !isOnCpu) return newFood;
            attempts++;
        }
        return newFood;
    }, []);

    // BFS for hint
    const getHintDirection = useCallback((head, target, body, cpuBody) => {
        const queue = [[head]];
        const visited = new Set([`${head.x},${head.y}`]);
        body.slice(1).forEach(s => visited.add(`${s.x},${s.y}`));
        cpuBody.forEach(s => visited.add(`${s.x},${s.y}`));

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
                { x: (curr.x + 1 + GRID_SIZE) % GRID_SIZE, y: curr.y },
                { x: (curr.x - 1 + GRID_SIZE) % GRID_SIZE, y: curr.y },
                { x: curr.x, y: (curr.y + 1 + GRID_SIZE) % GRID_SIZE },
                { x: curr.x, y: (curr.y - 1 + GRID_SIZE) % GRID_SIZE },
            ].filter(n => !visited.has(`${n.x},${n.y}`));

            for (const neighbor of neighbors) {
                visited.add(`${neighbor.x},${neighbor.y}`);
                queue.push([...path, neighbor]);
            }
        }
        return null;
    }, []);

    // CPU random safe direction
    const getCpuRandomDirection = useCallback((head, currentDir, cpuBody, playerBody) => {
        const possibleDirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ];

        // Filter out reverse direction
        const validDirs = possibleDirs.filter(d => !(d.x === -currentDir.x && d.y === -currentDir.y));

        // Shuffle for randomness
        const shuffled = validDirs.sort(() => Math.random() - 0.5);

        for (const dir of shuffled) {
            const newHead = {
                x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
                y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE,
            };

            const hitsOwnBody = cpuBody.slice(1).some(s => s.x === newHead.x && s.y === newHead.y);
            const hitsPlayer = playerBody.some(s => s.x === newHead.x && s.y === newHead.y);

            if (!hitsOwnBody && !hitsPlayer) {
                return dir;
            }
        }

        // No safe direction, just keep current
        return currentDir;
    }, []);

    // --- INIT GAME ---
    const initGame = useCallback(() => {
        setPlayerSnake(INITIAL_PLAYER_SNAKE);
        setCpuSnake(INITIAL_CPU_SNAKE);
        setDirection(INITIAL_DIRECTION);
        setCpuDirection({ x: -1, y: 0 });
        directionRef.current = INITIAL_DIRECTION;
        cpuDirectionRef.current = { x: -1, y: 0 };
        setFood({ x: 7, y: 7 });
        setScore(0);
        setHintSteps(0);
        setIsBoosting(false);
        setIsPaused(false);
        setGameOver(false);
        setGameWon(false);
    }, []);

    // --- START GAME ---
    const startGame = (timeIndex) => {
        const times = config?.times || [1, 2, 3];
        setSelectedTimeOption(timeIndex);
        setTimeLeft(times[timeIndex] * 60);
        setElapsedTime(0);
        initGame();
        setGameStarted(true);
    };

    // --- GAME LOOP ---
    const moveSnakes = useCallback(() => {
        if (gameOver || isPaused || !gameStarted) return;

        // Move Player
        setPlayerSnake((prevSnake) => {
            let nextDir = directionRef.current;

            // Hint Logic
            if (hintSteps > 0) {
                const aiDir = getHintDirection(prevSnake[0], food, prevSnake, cpuSnake);
                if (aiDir) {
                    nextDir = aiDir;
                    directionRef.current = nextDir;
                    setDirection(nextDir);
                }
                setHintSteps(prev => prev - 1);
            }

            const head = prevSnake[0];
            const newHead = {
                x: (head.x + nextDir.x + GRID_SIZE) % GRID_SIZE,
                y: (head.y + nextDir.y + GRID_SIZE) % GRID_SIZE,
            };

            // Check collision with own body
            if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                setGameOver(true);
                return prevSnake;
            }

            // Check collision with CPU snake
            if (cpuSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                setGameOver(true);
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Eat Food?
            if (newHead.x === food.x && newHead.y === food.y) {
                setScore(s => s + 50);
                setFood(getRandomFood(newSnake, cpuSnake));
                toast({
                    title: "+50 điểm!",
                    description: "Bạn ăn được mồi!",
                    className: "bg-emerald-600 border-none text-white",
                    duration: 1000
                });
            } else {
                newSnake.pop();
            }

            return newSnake;
        });

        // Move CPU
        setCpuSnake((prevCpu) => {
            const currentDir = cpuDirectionRef.current;

            // Get random safe direction
            const newDir = getCpuRandomDirection(prevCpu[0], currentDir, prevCpu, playerSnake);
            cpuDirectionRef.current = newDir;
            setCpuDirection(newDir);

            const head = prevCpu[0];
            const newHead = {
                x: (head.x + newDir.x + GRID_SIZE) % GRID_SIZE,
                y: (head.y + newDir.y + GRID_SIZE) % GRID_SIZE,
            };

            // Check CPU collision with own body
            const hitsSelf = prevCpu.slice(1).some(s => s.x === newHead.x && s.y === newHead.y);
            // Check CPU collision with player
            const hitsPlayer = playerSnake.some(s => s.x === newHead.x && s.y === newHead.y);

            if (hitsSelf || hitsPlayer) {
                // CPU dies, respawn and give player points
                setScore(s => s + 100);
                toast({
                    title: "+100 điểm!",
                    description: "Máy tự đâm và chết!",
                    className: "bg-amber-600 border-none text-white",
                    duration: 1500
                });

                // Respawn CPU
                return INITIAL_CPU_SNAKE;
            }

            const newCpu = [newHead, ...prevCpu];

            // CPU eats food?
            if (newHead.x === food.x && newHead.y === food.y) {
                setFood(getRandomFood(playerSnake, newCpu));
                toast({
                    title: "Máy ăn mồi!",
                    description: "Bạn mất mồi đó",
                    className: "bg-rose-600 border-none text-white",
                    duration: 1000
                });
            } else {
                newCpu.pop();
            }

            return newCpu;
        });
    }, [gameOver, isPaused, gameStarted, food, hintSteps, cpuSnake, playerSnake, getRandomFood, getHintDirection, getCpuRandomDirection, toast]);

    // --- GAME LOOP INTERVAL ---
    useEffect(() => {
        if (loading || gameOver || isPaused || !gameStarted) return;

        const baseSpeed = config?.speed || 150;
        const currentSpeed = isBoosting ? baseSpeed / 3 : baseSpeed;

        gameLoopRef.current = setInterval(moveSnakes, currentSpeed);
        return () => clearInterval(gameLoopRef.current);
    }, [loading, gameOver, isPaused, gameStarted, config, isBoosting, moveSnakes]);

    // --- TIMER ---
    useEffect(() => {
        if (!gameStarted || gameOver) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
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
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timerRef.current);
            clearInterval(elapsedRef.current);
        };
    }, [gameStarted, gameOver]);

    // --- SAVE HISTORY when game ends ---
    useEffect(() => {
        const saveHistory = async () => {
            if (gameOver && gameId && gameStarted) {
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
    }, [gameOver, gameId, score, elapsedTime, gameStarted]);

    // --- SAVE GAME SESSION ---
    const handleSave = async () => {
        if (!gameId) return;
        setIsSaving(true);
        try {
            await gameService.saveGameSession({
                game_id: gameId,
                matrix_state: JSON.stringify({
                    playerSnake,
                    cpuSnake,
                    food,
                    direction: directionRef.current,
                    cpuDirection: cpuDirectionRef.current
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

                setPlayerSnake(state.playerSnake);
                setCpuSnake(state.cpuSnake);
                setFood(state.food);
                directionRef.current = state.direction;
                cpuDirectionRef.current = state.cpuDirection;
                setDirection(state.direction);
                setCpuDirection(state.cpuDirection);
                setScore(session.current_score || 0);
                setElapsedTime(session.elapsed_time || 0);
                setGameStarted(true);
                setGameOver(false);
                setGameWon(false);

                toast({
                    title: "Đã load game!",
                    description: `Điểm: ${session.current_score}`,
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
        if (loading) return;

        // Time selection screen
        if (!gameStarted && !gameOver) {
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

        // Game over screen
        if (gameOver) {
            if (e.key === "Enter") {
                setGameStarted(false);
                setGameOver(false);
                setGameWon(false);
            }
            if (e.key === "Escape") navigate("/home");
            return;
        }

        // During gameplay
        const dx = directionRef.current.x;
        const dy = directionRef.current.y;

        switch (e.key) {
            case "ArrowLeft":
                directionRef.current = { x: dy, y: -dx };
                setDirection({ x: dy, y: -dx });
                break;
            case "ArrowRight":
                directionRef.current = { x: -dy, y: dx };
                setDirection({ x: -dy, y: dx });
                break;
            case "Enter":
                setIsBoosting(true);
                break;
            case "h": case "H":
                setHintSteps(5);
                setScore(prev => Math.max(0, prev - 30));
                toast({
                    title: "CPU Assistance (-30 điểm)",
                    description: "Máy tự điều khiển 5 bước!",
                    className: "bg-yellow-600 border-none text-white"
                });
                break;
            case "s": case "S":
                handleSave();
                break;
            case "Escape":
                setIsPaused(p => !p);
                break;
        }
    }, [loading, gameStarted, gameOver, config, selectedTimeOption, navigate, toast, handleSave, handleLoad, startGame]);

    const handleKeyUp = useCallback((e) => {
        if (e.key === "Enter") setIsBoosting(false);
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // --- LOADING STATE ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_SNAKE_SYSTEM...</span>
        </div>
    );

    const times = config?.times || [1, 2, 3];

    // --- TIME SELECTION SCREEN ---
    if (!gameStarted && !gameOver) {
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-3">
                        🐍 SNAKE BATTLE
                    </h2>
                    <p className="text-slate-400 text-sm">Đua với máy! Ăn mồi và sống sót</p>
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

    // --- MAIN GAME SCREEN ---
    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-5xl h-full px-4 py-2 justify-center">

            {/* Stats Bar */}
            <div className="grid grid-cols-4 w-full max-w-2xl gap-3">
                <StatBox label="ĐIỂM" value={score} color="text-emerald-400" icon={<Target className="w-3 h-3" />} />
                <StatBox label="BẠN" value={`${playerSnake.length} ô`} color="text-emerald-400" icon={<User className="w-3 h-3" />} />
                <StatBox label="MÁY" value={`${cpuSnake.length} ô`} color="text-blue-400" icon={<Cpu className="w-3 h-3" />} />
                <StatBox
                    label="THỜI GIAN"
                    value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
                    color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
                    icon={<Clock className="w-3 h-3" />}
                />
            </div>

            {/* Speed & Controls */}
            <div className="flex items-center gap-4 bg-slate-900/50 px-6 py-2 rounded-full border border-white/5">
                <div className={cn("flex items-center gap-2", isBoosting ? "text-rose-400" : "text-sky-400")}>
                    <Zap className="w-4 h-4" />
                    <span className="font-bold text-sm">{isBoosting ? "BOOST!" : "NORMAL"}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}
                    className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-500/20">
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
            </div>

            {/* Game Board */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2rem] blur-2xl" />

                <div
                    className="relative grid gap-[2px] p-3 bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-2xl ring-1 ring-white/5"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        width: 'min(90vw, 65vh)',
                        aspectRatio: '1/1'
                    }}
                >
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isFood = food.x === x && food.y === y;
                        const playerIdx = playerSnake.findIndex(s => s.x === x && s.y === y);
                        const cpuIdx = cpuSnake.findIndex(s => s.x === x && s.y === y);
                        const isPlayerHead = playerIdx === 0;
                        const isPlayerBody = playerIdx > 0;
                        const isCpuHead = cpuIdx === 0;
                        const isCpuBody = cpuIdx > 0;
                        const isHintActive = hintSteps > 0;

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "rounded-[2px] transition-all duration-100 relative",
                                    "bg-slate-900/40 border border-white/5",
                                    isFood && "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse",
                                    isPlayerHead && (isHintActive ? "bg-yellow-400" : "bg-emerald-400"),
                                    isPlayerHead && "shadow-[0_0_10px_rgba(52,211,153,0.5)] z-10 scale-110 rounded-sm",
                                    isPlayerBody && "bg-emerald-600/70",
                                    isCpuHead && "bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10 scale-110 rounded-sm",
                                    isCpuBody && "bg-blue-600/70"
                                )}
                            >
                                {isFood && (
                                    <div className="absolute inset-0 bg-white/20 animate-ping rounded-full m-1" />
                                )}
                            </div>
                        );
                    })}

                    {/* Game Over Overlay */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-30 animate-in fade-in zoom-in duration-300">
                            <div className={cn(
                                "p-6 border rounded-3xl shadow-2xl flex flex-col items-center max-w-[80%] text-center",
                                gameWon ? "bg-emerald-900/50 border-emerald-500/50" : "bg-rose-900/50 border-rose-500/50"
                            )}>
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center mb-4",
                                    gameWon ? "bg-emerald-500/20" : "bg-rose-500/20"
                                )}>
                                    {gameWon ? <Trophy className="w-10 h-10 text-emerald-400" /> : <Frown className="w-10 h-10 text-rose-400" />}
                                </div>
                                <h2 className="text-3xl font-black text-white mb-1 tracking-tighter">
                                    {gameWon ? "BẠN THẮNG!" : "GAME OVER"}
                                </h2>
                                <p className="text-slate-400 text-sm mb-6 font-mono">ĐIỂM: {score}</p>
                                <Button
                                    onClick={() => { setGameStarted(false); setGameOver(false); setGameWon(false); }}
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

                    {/* Pause Overlay */}
                    {isPaused && !gameOver && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <div className="bg-slate-900/90 px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
                                <Info className="w-4 h-4 text-sky-400" />
                                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">PAUSED - [ESC] TO RESUME</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Guide */}
            <div className="text-slate-500 text-xs font-mono text-center">
                [←/→] Rẽ | [ENTER giữ] Boost | [H] Hint | [S] Lưu | [ESC] Tạm dừng
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
            <span className={cn("text-sm font-mono font-black", color)}>
                {typeof value === "number" ? String(value).padStart(4, '0') : value}
            </span>
        </div>
    );
}
