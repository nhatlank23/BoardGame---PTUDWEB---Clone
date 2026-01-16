import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Trophy, Target, Zap, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";

const GRID_SIZE = 15;
const INITIAL_SNAKE = [
    { x: 5, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 7 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };

export default function SnakeGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState({ x: 10, y: 7 });
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [isBoosting, setIsBoosting] = useState(false);
    const [hintSteps, setHintSteps] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const gameLoopRef = useRef();
    const directionRef = useRef(INITIAL_DIRECTION);

    // --- 1. LẤY CONFIG TỪ API ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("snake");
                if (response.status === "success" && response.data?.config) {
                    setConfig(response.data.config);
                } else {
                    setConfig({ speed: 150 });
                }
            } catch (error) {
                console.error("Failed to fetch snake config:", error);
                setConfig({ speed: 150 });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Helper: Random Food Position
    const getRandomFood = useCallback((currentSnake) => {
        let newFood;
        let attempts = 0;
        while (attempts < 100) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            const isOnSnake = currentSnake.some(s => s.x === newFood.x && s.y === newFood.y);
            if (!isOnSnake) return newFood;
            attempts++;
        }
        return newFood;
    }, []);


    const getHintDirection = useCallback((head, target, body) => {
        const queue = [[head]];
        const visited = new Set([`${head.x},${head.y}`])
        body.slice(1).forEach(segment => visited.add(`${segment.x},${segment.y}`));

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

            const potentialNeighbors = [
                { x: (curr.x + 1 + GRID_SIZE) % GRID_SIZE, y: curr.y },
                { x: (curr.x - 1 + GRID_SIZE) % GRID_SIZE, y: curr.y },
                { x: curr.x, y: (curr.y + 1 + GRID_SIZE) % GRID_SIZE },
                { x: curr.x, y: (curr.y - 1 + GRID_SIZE) % GRID_SIZE },
            ];

            const neighbors = potentialNeighbors.filter(n =>
                !visited.has(`${n.x},${n.y}`)
            );

            for (const neighbor of neighbors) {
                visited.add(`${neighbor.x},${neighbor.y}`);
                queue.push([...path, neighbor]);
            }
        }
        return null;
    }, []);

    // --- 2. GAME LOOP LOGIC ---
    const moveSnake = useCallback(() => {
        if (gameOver || isPaused) return;

        setSnake((prevSnake) => {
            let nextDir = directionRef.current;

            // Hint Logic (Auto-control for 5 steps)
            if (hintSteps > 0) {
                const aiDir = getHintDirection(prevSnake[0], food, prevSnake);
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

            const willEat = newHead.x === food.x && newHead.y === food.y;
            if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                setGameOver(true);
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Eat Food?
            if (willEat) {
                setScore(s => s + 10);
                setFood(getRandomFood(newSnake));
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [gameOver, isPaused, food, hintSteps, getRandomFood, getHintDirection]);
    useEffect(() => {
        if (loading || gameOver || isPaused) return;

        const baseSpeed = config?.speed || 150;
        const currentSpeed = isBoosting ? baseSpeed / 3 : baseSpeed;

        gameLoopRef.current = setInterval(moveSnake, currentSpeed);
        return () => clearInterval(gameLoopRef.current);
    }, [loading, gameOver, isPaused, config, isBoosting, moveSnake]);

    // --- 3. CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (gameOver) {
            if (e.key === "Enter") resetGame();
            return;
        }

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
                toast({
                    title: "CPU Assistance",
                    description: "Máy tự điều khiển 5 bước an toàn!",
                    className: "bg-yellow-600 border-none text-white"
                });
                break;
            case "Escape":
                setIsPaused(p => !p);
                break;
        }
    }, [gameOver, toast]);

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

    const resetGame = () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        directionRef.current = INITIAL_DIRECTION;
        setFood({ x: 10, y: 7 });
        setScore(0);
        setGameOver(false);
        setHintSteps(0);
        setIsBoosting(false);
        setIsPaused(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_SNAKE_SYSTEM...</span>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl px-4">

            {/* Header Stats */}
            <div className="grid grid-cols-3 w-full gap-4">
                <StatBox label="SCORE" value={score} color="text-emerald-500" />
                <StatBox label="SPEED" value={isBoosting ? "BOOST" : "NORMAL"} color={isBoosting ? "text-rose-500" : "text-sky-400"} />
                <StatBox label="HINTS" value={hintSteps > 0 ? hintSteps : "READY"} color={hintSteps > 0 ? "text-yellow-500" : "text-slate-400"} />
            </div>

            {/* Matrix Display */}
            <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2rem] blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500" />

                <div
                    className="relative grid gap-1 p-3 bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-2xl ring-1 ring-white/5"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        width: 'min(85vw, 420px)',
                        aspectRatio: '1/1'
                    }}
                >
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isFood = food.x === x && food.y === y;
                        const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
                        const isHead = snakeIndex === 0;
                        const isBody = snakeIndex > 0;
                        const isHintActive = hintSteps > 0;

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "rounded-[2px] transition-all duration-150 relative overflow-hidden",
                                    "bg-slate-900/40 border border-white/5",
                                    isFood && "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse",
                                    isHead && (isHintActive ? "bg-yellow-400" : "bg-emerald-400"),
                                    isHead && "shadow-[0_0_12px_rgba(52,211,153,0.5)] z-10 scale-110 rounded-sm",
                                    isBody && "bg-emerald-600/60 shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]"
                                )}
                            >
                                {isFood && (
                                    <div className="absolute inset-0 bg-white/20 animate-ping rounded-full m-1" />
                                )}
                            </div>
                        );
                    })}

                    {/* Overlays */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-30 animate-in fade-in zoom-in duration-300">
                            <div className="p-6 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col items-center max-w-[80%] text-center">
                                <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Trophy className="w-10 h-10 text-rose-500" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-1 tracking-tighter">GAME OVER</h2>
                                <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest font-mono">Final Data: {String(score).padStart(4, '0')}</p>
                                <Button
                                    onClick={resetGame}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                                >
                                    <RefreshCw className="mr-2 h-5 w-5" /> INITIALIZE_NEW_SYSTEM
                                </Button>
                            </div>
                        </div>
                    )}

                    {isPaused && !gameOver && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <div className="bg-slate-900/90 px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
                                <Info className="w-4 h-4 text-sky-400" />
                                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">PAUSED - PRESS [ESC] TO RESUME</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Guide */}
            <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <ControlHint keys={["←", "→"]} label="RELATIVE STEER" />
                <div className="w-px h-8 bg-white/5" />
                <ControlHint keys={["H"]} label="AI DRIFT" icon={<Zap className="w-3 h-3 text-yellow-500" />} />
                <div className="w-px h-8 bg-white/5" />
                <ControlHint keys={["ENT"]} label="BOOST" icon={<Target className="w-3 h-3 text-rose-500" />} />
            </div>
        </div>
    );
}

function StatBox({ label, value, color }) {
    return (
        <div className="bg-slate-900/60 border border-white/5 p-3 rounded-2xl backdrop-blur-md flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-1">{label}</span>
            <span className={cn("text-xl font-mono font-black", color)}>
                {typeof value === "number" ? String(value).padStart(4, '0') : value}
            </span>
        </div>
    );
}

function ControlHint({ keys, label, icon }) {
    return (
        <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-slate-950 border border-white/10 rounded shadow-md text-[10px] font-bold text-slate-300">
                        {k}
                    </kbd>
                ))}
            </div>
            <div className="flex items-center gap-1">
                {icon}
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase">{label}</span>
            </div>
        </div>
    );
}
