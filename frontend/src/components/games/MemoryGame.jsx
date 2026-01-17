import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Brain, Loader2, Clock, Save, Download, Trophy, Frown, Target, Zap, User, Cpu, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";

const ICONS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];

export default function MemoryGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [gameId, setGameId] = useState(null);

    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedIndices, setMatchedIndices] = useState([]);
    const [cursorPos, setCursorPos] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [seenCards, setSeenCards] = useState(new Set());

    // Turn-based: true = Player, false = Computer
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);

    // Timer & Score
    const [selectedTimeOption, setSelectedTimeOption] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [playerScore, setPlayerScore] = useState(0);
    const [playerPairs, setPlayerPairs] = useState(0);
    const [computerPairs, setComputerPairs] = useState(0);
    const [comboCount, setComboCount] = useState(0);
    const [hintPenalty, setHintPenalty] = useState(0);

    // Game state flags
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [hintIndices, setHintIndices] = useState([]);

    const timerRef = useRef();
    const elapsedRef = useRef();

    // --- 1. FETCH CONFIG ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("memory");
                if (response.status === "success") {
                    setConfig(response.data.config);
                    setGameId(response.data.id);
                    const times = response.data.config?.times || [1, 2, 3];
                    setTimeLeft(times[0] * 60);
                }
            } catch (error) {
                toast({ title: "Lỗi", description: "Không tải được cấu hình game", variant: "destructive" });
                setConfig({ times: [1, 2, 3] });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [toast]);

    // --- INIT GAME ---
    const initGame = useCallback(() => {
        const pairs = [...ICONS, ...ICONS];
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        setCards(pairs);
        setFlippedIndices([]);
        setMatchedIndices([]);
        setSeenCards(new Set());
        setCursorPos(0);
        setIsChecking(false);
        setIsPlayerTurn(true);
        setPlayerPairs(0);
        setComputerPairs(0);
        setComboCount(0);
        setHintPenalty(0);
        setHintIndices([]);
    }, []);

    // --- CALCULATE FINAL SCORE ---
    const calculateFinalScore = useCallback(() => {
        let score = 0;
        let breakdown = [];

        // Base score: pairs x 100
        const pairScore = playerPairs * 100;
        score += pairScore;
        breakdown.push(`+${pairScore} (${playerPairs} cặp)`);

        // Win bonus: +500 if player has more pairs
        if (playerPairs > computerPairs) {
            score += 500;
            breakdown.push("+500 (Thắng)");
        } else if (playerPairs === computerPairs) {
            breakdown.push("+0 (Hòa)");
        } else {
            breakdown.push("+0 (Thua)");
        }

        // Hint penalty
        if (hintPenalty > 0) {
            score -= hintPenalty;
            breakdown.push(`-${hintPenalty} (Hint)`);
        }

        // Time penalty
        const timePenalty = elapsedTime;
        score -= timePenalty;
        breakdown.push(`-${timePenalty} (Thời gian)`);

        return { score: Math.max(0, score), breakdown };
    }, [playerPairs, computerPairs, hintPenalty, elapsedTime]);

    // --- HANDLE FLIP ---
    const handleFlip = useCallback((idx) => {
        if (!gameStarted || gameEnded || isChecking || !isPlayerTurn) return;
        if (flippedIndices.includes(idx) || matchedIndices.includes(idx)) return;

        // Check if card was already seen (penalty)
        if (seenCards.has(idx) && !matchedIndices.includes(idx)) {
            setPlayerScore(prev => Math.max(0, prev - 10));
            toast({
                title: "-10 điểm",
                description: "Bạn đã lật ô này trước đó!",
                className: "bg-rose-600 border-none text-white"
            });
        }

        // Mark as seen
        setSeenCards(prev => new Set([...prev, idx]));
        setFlippedIndices(prev => [...prev, idx]);
    }, [gameStarted, gameEnded, isChecking, isPlayerTurn, flippedIndices, matchedIndices, seenCards, toast]);

    // --- MATCH CHECK LOGIC ---
    useEffect(() => {
        if (flippedIndices.length !== 2) return;

        setIsChecking(true);
        const [first, second] = flippedIndices;

        const timer = setTimeout(() => {
            if (cards[first] === cards[second]) {
                // Match found!
                setMatchedIndices(prev => [...prev, first, second]);

                if (isPlayerTurn) {
                    // Calculate combo bonus
                    const baseScore = 100;
                    const comboBonus = comboCount * 50;
                    const totalPoints = baseScore + comboBonus;

                    setPlayerScore(prev => prev + totalPoints);
                    setPlayerPairs(prev => prev + 1);
                    setComboCount(prev => prev + 1);

                    toast({
                        title: `+${totalPoints} điểm!`,
                        description: comboBonus > 0 ? `Combo x${comboCount + 1}!` : "Tìm được cặp!",
                        className: "bg-emerald-600 border-none text-white"
                    });

                    // Player continues
                } else {
                    // Computer matched
                    setComputerPairs(prev => prev + 1);
                    toast({
                        title: "Máy tìm được cặp!",
                        description: `Máy: ${computerPairs + 1} cặp`,
                        className: "bg-blue-600 border-none text-white"
                    });
                }

                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                // No match
                if (isPlayerTurn) {
                    setComboCount(0); // Reset combo
                }

                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                    setIsPlayerTurn(prev => !prev); // Switch turn
                }, 500);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [flippedIndices, cards, isPlayerTurn, comboCount, computerPairs, toast]);

    // --- COMPUTER AI ---
    useEffect(() => {
        if (!isPlayerTurn && gameStarted && !gameEnded && !isChecking && matchedIndices.length < cards.length) {
            const timer = setTimeout(() => {
                const available = cards
                    .map((_, i) => i)
                    .filter(i => !matchedIndices.includes(i) && !flippedIndices.includes(i));

                if (available.length >= 2) {
                    // Random pick 2 cards
                    const shuffled = [...available].sort(() => Math.random() - 0.5);
                    const [first, second] = shuffled.slice(0, 2);

                    setSeenCards(prev => new Set([...prev, first]));
                    setFlippedIndices([first]);

                    setTimeout(() => {
                        setSeenCards(prev => new Set([...prev, second]));
                        setFlippedIndices([first, second]);
                    }, 600);
                }
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, gameStarted, gameEnded, isChecking, matchedIndices, cards, flippedIndices]);

    // --- GAME END CHECK ---
    useEffect(() => {
        if (gameStarted && cards.length > 0 && matchedIndices.length === cards.length) {
            setGameEnded(true);
        }
    }, [gameStarted, matchedIndices, cards]);

    // --- TIMER ---
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

    // --- SAVE HISTORY when game ends ---
    useEffect(() => {
        const saveHistory = async () => {
            if (gameEnded && gameId) {
                const { score } = calculateFinalScore();
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
    }, [gameEnded, gameId, elapsedTime, calculateFinalScore]);

    // --- HINT ---
    const handleHint = () => {
        if (!gameStarted || gameEnded || !isPlayerTurn || isChecking) return;

        // Find an unmatched pair
        const unmatched = cards
            .map((icon, i) => ({ icon, i }))
            .filter(({ i }) => !matchedIndices.includes(i));

        const iconGroups = {};
        unmatched.forEach(({ icon, i }) => {
            if (!iconGroups[icon]) iconGroups[icon] = [];
            iconGroups[icon].push(i);
        });

        const pair = Object.values(iconGroups).find(arr => arr.length >= 2);
        if (pair) {
            setHintIndices(pair.slice(0, 2));
            setHintPenalty(prev => prev + 50);
            setPlayerScore(prev => Math.max(0, prev - 50));

            toast({
                title: "-50 điểm (Hint)",
                description: "Cặp trùng đang nhấp nháy!",
                className: "bg-amber-600 border-none text-white"
            });

            setTimeout(() => setHintIndices([]), 2000);
        }
    };

    // --- SAVE GAME SESSION ---
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
                    seenCards: [...seenCards]
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

                setCards(state.cards);
                setMatchedIndices(state.matchedIndices || []);
                setPlayerPairs(state.playerPairs || 0);
                setComputerPairs(state.computerPairs || 0);
                setIsPlayerTurn(state.isPlayerTurn ?? true);
                setComboCount(state.comboCount || 0);
                setSeenCards(new Set(state.seenCards || []));
                setPlayerScore(session.current_score || 0);
                setElapsedTime(session.elapsed_time || 0);
                setFlippedIndices([]);
                setGameStarted(true);
                setGameEnded(false);

                toast({
                    title: "Đã load game!",
                    description: `Điểm hiện tại: ${session.current_score}`,
                    className: "bg-teal-600 border-none text-white"
                });
            }
        } catch (error) {
            toast({ title: "Thông báo", description: "Không tìm thấy game đã lưu", variant: "default" });
        } finally {
            setIsLoadingSession(false);
        }
    };

    // --- START GAME ---
    const startGame = (timeIndex) => {
        const times = config?.times || [1, 2, 3];
        setSelectedTimeOption(timeIndex);
        setTimeLeft(times[timeIndex] * 60);
        setElapsedTime(0);
        setPlayerScore(0);
        initGame();
        setGameStarted(true);
        setGameEnded(false);
    };

    // --- CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (loading) return;

        // Time selection screen
        if (!gameStarted && !gameEnded) {
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

        // Game ended screen
        if (gameEnded) {
            if (e.key === "Enter") {
                setGameStarted(false);
                setGameEnded(false);
            }
            if (e.key === "Escape") navigate("/home");
            return;
        }

        // During gameplay
        if (!isPlayerTurn || isChecking) return;

        switch (e.key) {
            case "ArrowRight":
                setCursorPos(prev => (prev + 1) % 16);
                break;
            case "ArrowLeft":
                setCursorPos(prev => (prev - 1 + 16) % 16);
                break;
            case "ArrowDown":
                setCursorPos(prev => (prev + 4) % 16);
                break;
            case "ArrowUp":
                setCursorPos(prev => (prev - 4 + 16) % 16);
                break;
            case "Enter":
                handleFlip(cursorPos);
                break;
            case "h": case "H":
                handleHint();
                break;
            case "s": case "S":
                handleSave();
                break;
            case "Escape":
                handleSave();
                navigate("/home");
                break;
        }
    }, [loading, gameStarted, gameEnded, isPlayerTurn, isChecking, cursorPos, handleFlip, handleHint, handleSave, handleLoad, navigate, config, selectedTimeOption, startGame]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // --- LOADING STATE ---
    if (loading) return (
        <div className="flex flex-col h-full items-center justify-center gap-4">
            <Loader2 className="animate-spin text-purple-500 w-12 h-12" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_MEMORY_GAME...</span>
        </div>
    );

    const times = config?.times || [1, 2, 3];

    // --- TIME SELECTION SCREEN ---
    if (!gameStarted && !gameEnded) {
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-3">
                        <Brain className="w-10 h-10 text-purple-400" />
                        MEMORY GAME
                    </h2>
                    <p className="text-slate-400 text-sm">Chọn thời gian chơi</p>
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
                                    : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                            )}
                        >
                            <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-purple-400" : "text-slate-400")} />
                            <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-purple-400" : "text-slate-300")}>
                                {t} phút
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => startGame(selectedTimeOption)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
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

    // --- GAME END SCREEN ---
    if (gameEnded) {
        const { score, breakdown } = calculateFinalScore();
        const playerWon = playerPairs > computerPairs;

        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <div className={cn(
                    "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
                    playerWon ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
                )}>
                    <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center",
                        playerWon ? "bg-emerald-500/20" : "bg-rose-500/20"
                    )}>
                        {playerWon ? <Trophy className="w-12 h-12 text-emerald-400" /> : <Frown className="w-12 h-12 text-rose-400" />}
                    </div>

                    <div className="text-center">
                        <h2 className="text-4xl font-black text-white mb-2">
                            {playerWon ? "BẠN THẮNG!" : playerPairs === computerPairs ? "HÒA!" : "MÁY THẮNG!"}
                        </h2>
                        <p className="text-slate-400">Bạn: {playerPairs} cặp | Máy: {computerPairs} cặp</p>
                    </div>

                    <div className="bg-slate-950/50 px-8 py-4 rounded-2xl text-center">
                        <span className="text-slate-400 text-sm">TỔNG ĐIỂM</span>
                        <p className="text-5xl font-black text-white">{score}</p>
                        <div className="text-xs text-slate-500 mt-2">
                            {breakdown.join(" | ")}
                        </div>
                    </div>

                    <Button
                        onClick={() => { setGameStarted(false); setGameEnded(false); }}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
                    >
                        CHƠI LẠI
                    </Button>
                </div>
            </div>
        );
    }

    // --- MAIN GAME SCREEN ---
    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-3xl h-full px-4 py-2 justify-center">

            {/* Stats Bar */}
            <div className="grid grid-cols-5 w-full gap-2">
                <StatBox label="ĐIỂM" value={playerScore} color="text-emerald-400" icon={<Target className="w-3 h-3" />} />
                <StatBox label="BẠN" value={`${playerPairs} cặp`} color="text-purple-400" icon={<User className="w-3 h-3" />} />
                <StatBox label="MÁY" value={`${computerPairs} cặp`} color="text-blue-400" icon={<Cpu className="w-3 h-3" />} />
                <StatBox
                    label="THỜI GIAN"
                    value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
                    color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
                    icon={<Clock className="w-3 h-3" />}
                />
                <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl flex items-center justify-center gap-1">
                    <Button size="sm" variant="ghost" onClick={handleHint} disabled={!isPlayerTurn || isChecking}
                        className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/20">
                        <Lightbulb className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}
                        className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-500/20">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleLoad} disabled={isLoadingSession}
                        className="h-7 w-7 p-0 text-teal-400 hover:bg-teal-500/20">
                        {isLoadingSession ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    </Button>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="flex items-center gap-4 bg-slate-900/50 px-6 py-2 rounded-full border border-white/5">
                <div className={cn("flex items-center gap-2", isPlayerTurn ? "text-purple-400" : "text-slate-500")}>
                    <User className="w-4 h-4" />
                    <span className="font-bold text-sm">LƯỢT CỦA BẠN</span>
                </div>
                <span className="text-slate-600">|</span>
                <div className={cn("flex items-center gap-2", !isPlayerTurn ? "text-blue-400" : "text-slate-500")}>
                    <Cpu className="w-4 h-4" />
                    <span className="font-bold text-sm">LƯỢT CỦA MÁY</span>
                </div>
                {!isPlayerTurn && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                {comboCount > 0 && isPlayerTurn && (
                    <span className="text-amber-400 font-bold text-sm animate-pulse">
                        <Zap className="w-4 h-4 inline" /> COMBO x{comboCount}
                    </span>
                )}
            </div>

            {/* Game Board */}
            <div className="relative">
                <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl" />
                <div
                    id="memory-grid"
                    className={cn(
                        "relative grid grid-cols-4 gap-3 bg-slate-900 p-4 rounded-2xl shadow-2xl border-4 border-slate-700 transition-all",
                        !isPlayerTurn && "opacity-80"
                    )}
                    style={{ width: 'min(90vw, 65vh)', aspectRatio: '1/1' }}
                >
                    {cards.map((icon, i) => {
                        const isFlipped = flippedIndices.includes(i);
                        const isMatched = matchedIndices.includes(i);
                        const isRevealed = isFlipped || isMatched;
                        const isCursor = i === cursorPos && isPlayerTurn;
                        const isHinted = hintIndices.includes(i);

                        return (
                            <div
                                key={i}
                                onClick={() => isPlayerTurn && handleFlip(i)}
                                className={cn(
                                    "rounded-xl flex items-center justify-center text-3xl sm:text-4xl transition-all duration-300 cursor-pointer border-2 relative aspect-square",
                                    isCursor && !isChecking && "border-yellow-400 scale-105 z-10 shadow-[0_0_20px_rgba(250,204,21,0.4)]",
                                    !isCursor && "border-slate-600",
                                    isMatched && "bg-emerald-600/20 border-emerald-500",
                                    isFlipped && !isMatched && "bg-indigo-600 border-indigo-400",
                                    !isRevealed && "bg-slate-700 shadow-inner",
                                    isHinted && "animate-pulse border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]",
                                    !isPlayerTurn && "pointer-events-none"
                                )}
                            >
                                <span className={cn(
                                    "transition-opacity duration-300 pointer-events-none",
                                    isRevealed ? "opacity-100" : "opacity-0"
                                )}>
                                    {icon}
                                </span>

                                {!isRevealed && (
                                    <HelpCircle className="w-1/3 h-1/3 text-slate-600 absolute opacity-50" />
                                )}
                            </div>
                        );
                    })}
                </div>
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
            <span className={cn("text-sm font-mono font-black", color)}>{value}</span>
        </div>
    );
}
