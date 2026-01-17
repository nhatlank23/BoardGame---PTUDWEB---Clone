import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, X, Circle, Trophy, Clock, Save, Download, Frown, Target, Zap, User, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";
import { cn } from "@/lib/utils";

export default function TicTacToeGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [cursorPos, setCursorPos] = useState(4);
    const [winner, setWinner] = useState(null);

    // Timer & Score
    const [selectedTimeOption, setSelectedTimeOption] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [roundScore, setRoundScore] = useState(0);
    const [playerMoves, setPlayerMoves] = useState(0);
    const [roundsPlayed, setRoundsPlayed] = useState(0);

    // Game state flags
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const timerRef = useRef();
    const elapsedRef = useRef();

    // --- 1. FETCH CONFIG ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("tic-tac-toe");
                if (response.status === "success") {
                    setConfig(response.data.config);
                    setGameId(response.data.id);
                    // Default time from first option (in minutes -> seconds)
                    const times = response.data.config?.times || [1, 2, 5];
                    setTimeLeft(times[0] * 60);
                }
            } catch (error) {
                toast({ title: "Lỗi", description: "Không tải được cấu hình game", variant: "destructive" });
                setConfig({ win: 3, cols: 3, rows: 3, times: [1, 2, 5] });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [toast]);

    // --- GAME LOGIC ---
    const calculateWinner = useCallback((squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    }, []);

    // --- SCORING ---
    const calculateRoundScore = useCallback((result, timeRemaining, moves) => {
        let score = 0;
        let breakdown = [];

        if (result === "X") {
            // Player wins
            score += 100;
            breakdown.push("+100 (Thắng)");

            // Time bonus: if timeRemaining > (totalTime - 10), add bonus
            if (timeRemaining > 0) {
                const timeBonus = Math.floor(timeRemaining * 2);
                if (timeBonus > 0) {
                    score += timeBonus;
                    breakdown.push(`+${timeBonus} (Thời gian)`);
                }
            }

            // Efficiency bonus: win in exactly 3 moves
            if (moves <= 3) {
                score += 50;
                breakdown.push("+50 (Hiệu quả)");
            }
        } else if (result === "Draw") {
            score += 20;
            breakdown.push("+20 (Hòa)");
        } else {
            // Player loses
            breakdown.push("+0 (Thua)");
        }

        return { score, breakdown };
    }, []);

    // --- HANDLE MOVE ---
    const handleClick = useCallback((i) => {
        if (winner || board[i] || !gameStarted || gameEnded) return;

        const newBoard = [...board];
        newBoard[i] = isXNext ? "X" : "O";
        setBoard(newBoard);
        setIsXNext(!isXNext);

        if (isXNext) {
            setPlayerMoves(prev => prev + 1);
        }

        const w = calculateWinner(newBoard);
        if (w) {
            setWinner(w);
            const timeRemaining = timeLeft;
            const { score, breakdown } = calculateRoundScore(w, timeRemaining, playerMoves + 1);
            setRoundScore(score);
            setTotalScore(prev => prev + score);
            setRoundsPlayed(prev => prev + 1);

            toast({
                title: w === "X" ? "🎉 Bạn Thắng!" : "💻 Máy Thắng!",
                description: breakdown.join(" | "),
                className: w === "X" ? "bg-emerald-600 border-none text-white" : "bg-rose-600 border-none text-white"
            });
        } else if (!newBoard.includes(null)) {
            setWinner("Draw");
            const { score, breakdown } = calculateRoundScore("Draw", timeLeft, playerMoves + 1);
            setRoundScore(score);
            setTotalScore(prev => prev + score);
            setRoundsPlayed(prev => prev + 1);

            toast({
                title: "🤝 Hòa!",
                description: breakdown.join(" | "),
                className: "bg-amber-600 border-none text-white"
            });
        }
    }, [board, isXNext, winner, gameStarted, gameEnded, calculateWinner, calculateRoundScore, timeLeft, playerMoves, toast]);

    // --- COMPUTER AI (Random valid move) ---
    useEffect(() => {
        if (!isXNext && !winner && gameStarted && !gameEnded && !loading) {
            const timer = setTimeout(() => {
                const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (emptyIndices.length > 0) {
                    const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                    handleClick(randomMove);
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner, board, loading, handleClick, gameStarted, gameEnded]);

    // --- TIMER ---
    useEffect(() => {
        if (!gameStarted || gameEnded || winner) return;

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
    }, [gameStarted, gameEnded, winner]);

    // --- SAVE HISTORY when game ends ---
    useEffect(() => {
        const saveHistory = async () => {
            if (gameEnded && gameId && totalScore > 0) {
                try {
                    await gameService.savePlayHistory({
                        game_id: gameId,
                        score: totalScore,
                        duration: elapsedTime
                    });
                    toast({
                        title: "Đã lưu kết quả!",
                        description: `Điểm số: ${totalScore} | Thời gian: ${elapsedTime}s`,
                        className: "bg-violet-600 border-none text-white"
                    });
                } catch (error) {
                    console.error("Failed to save history:", error);
                }
            }
        };
        saveHistory();
    }, [gameEnded, gameId, totalScore, elapsedTime, toast]);

    // --- SAVE GAME SESSION ---
    const handleSave = async () => {
        if (!gameId) return;
        setIsSaving(true);
        try {
            await gameService.saveGameSession({
                game_id: gameId,
                matrix_state: JSON.stringify({ board, isXNext, playerMoves, roundsPlayed }),
                current_score: totalScore,
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
        setIsLoading(true);
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
                setElapsedTime(session.elapsed_time || 0);
                setGameStarted(true);
                setWinner(null);

                toast({
                    title: "Đã load game!",
                    description: `Điểm hiện tại: ${session.current_score}`,
                    className: "bg-teal-600 border-none text-white"
                });
            }
        } catch (error) {
            toast({ title: "Thông báo", description: "Không tìm thấy game đã lưu", variant: "default" });
        } finally {
            setIsLoading(false);
        }
    };

    // --- NEW ROUND ---
    const startNewRound = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsXNext(true);
        setPlayerMoves(0);
        setRoundScore(0);
        setCursorPos(4);
    };

    // --- START GAME ---
    const startGame = (timeIndex) => {
        const times = config?.times || [1, 2, 5];
        setSelectedTimeOption(timeIndex);
        setTimeLeft(times[timeIndex] * 60);
        setElapsedTime(0);
        setTotalScore(0);
        setRoundsPlayed(0);
        setPlayerMoves(0);
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsXNext(true);
        setGameStarted(true);
        setGameEnded(false);
    };

    // --- CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (loading) return;

        // Time selection screen
        if (!gameStarted && !gameEnded) {
            const times = config?.times || [1, 2, 5];
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
                case "h": case "H":
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

        // Round ended (winner exists)
        if (winner) {
            if (e.key === "Enter") startNewRound();
            if (e.key === "s" || e.key === "S") handleSave();
            if (e.key === "Escape") navigate("/home");
            return;
        }

        // During gameplay
        if (!isXNext) return;

        switch (e.key) {
            case "ArrowRight":
                setCursorPos((prev) => (prev + 1) % 9);
                break;
            case "ArrowLeft":
                setCursorPos((prev) => (prev - 1 + 9) % 9);
                break;
            case "Enter":
                handleClick(cursorPos);
                break;
            case "s": case "S":
                handleSave();
                break;
            case "h": case "H":
                const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (emptyIndices.length > 0) {
                    const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                    toast({
                        title: "Gợi ý",
                        description: `Thử đánh vào ô số ${randomMove + 1}`,
                        className: "bg-yellow-900 border-yellow-500 text-yellow-100"
                    });
                }
                break;
            case "Escape":
                handleSave();
                navigate("/home");
                break;
        }
    }, [loading, gameStarted, gameEnded, winner, isXNext, board, cursorPos, handleClick, navigate, toast, config, selectedTimeOption, handleSave, handleLoad, startGame, startNewRound]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // --- LOADING STATE ---
    if (loading) return (
        <div className="flex flex-col h-full items-center justify-center gap-4">
            <Loader2 className="animate-spin text-red-500 w-12 h-12" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_TIC_TAC_TOE...</span>
        </div>
    );

    const times = config?.times || [1, 2, 5];

    // --- TIME SELECTION SCREEN ---
    if (!gameStarted && !gameEnded) {
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">TIC TAC TOE</h2>
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
                                    ? "bg-red-500/20 border-red-500 scale-110 shadow-lg shadow-red-500/30"
                                    : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                            )}
                        >
                            <Clock className={cn("w-8 h-8", selectedTimeOption === idx ? "text-red-400" : "text-slate-400")} />
                            <span className={cn("text-2xl font-black", selectedTimeOption === idx ? "text-red-400" : "text-slate-300")}>
                                {t} phút
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => startGame(selectedTimeOption)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-12 py-6 rounded-2xl text-lg"
                    >
                        BẮT ĐẦU
                    </Button>
                    <Button
                        onClick={handleLoad}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 rounded-2xl"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                        LOAD
                    </Button>
                </div>

                <p className="text-slate-600 text-xs font-mono">[←/→] Chọn | [ENTER] Bắt đầu | [H] Load game</p>
            </div>
        );
    }

    // --- GAME END SCREEN ---
    if (gameEnded) {
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <div className={cn(
                    "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
                    totalScore > 0 ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
                )}>
                    <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center",
                        totalScore > 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                    )}>
                        {totalScore > 0 ? <Trophy className="w-12 h-12 text-emerald-400" /> : <Frown className="w-12 h-12 text-rose-400" />}
                    </div>

                    <div className="text-center">
                        <h2 className="text-4xl font-black text-white mb-2">HẾT GIỜ!</h2>
                        <p className="text-slate-400">Bạn đã chơi {roundsPlayed} ván</p>
                    </div>

                    <div className="bg-slate-950/50 px-8 py-4 rounded-2xl">
                        <span className="text-slate-400 text-sm">TỔNG ĐIỂM</span>
                        <p className="text-5xl font-black text-white">{totalScore}</p>
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
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl h-full px-4 py-2 justify-center">

            {/* Stats Bar */}
            <div className="grid grid-cols-4 w-full gap-3">
                <StatBox label="ĐIỂM" value={totalScore} color="text-emerald-400" icon={<Target className="w-4 h-4" />} />
                <StatBox label="VÁN" value={roundsPlayed} color="text-violet-400" icon={<Zap className="w-4 h-4" />} />
                <StatBox
                    label="THỜI GIAN"
                    value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
                    color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}
                    icon={<Clock className="w-4 h-4" />}
                />
                <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 w-8 p-0 text-sky-400 hover:bg-sky-500/20"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleLoad}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-teal-400 hover:bg-teal-500/20"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="flex items-center gap-4 bg-slate-900/50 px-6 py-2 rounded-full border border-white/5">
                <div className={cn("flex items-center gap-2", isXNext ? "text-red-400" : "text-slate-500")}>
                    <User className="w-4 h-4" />
                    <span className="font-bold text-sm">BẠN (X)</span>
                </div>
                <span className="text-slate-600">vs</span>
                <div className={cn("flex items-center gap-2", !isXNext ? "text-blue-400" : "text-slate-500")}>
                    <Cpu className="w-4 h-4" />
                    <span className="font-bold text-sm">MÁY (O)</span>
                </div>
                {!isXNext && !winner && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </div>

            {/* Game Board */}
            <div className="relative">
                <div className="absolute -inset-4 bg-red-500/10 rounded-3xl blur-2xl" />
                <div className="relative grid grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl shadow-2xl border-4 border-slate-700"
                    style={{ width: 'min(90vw, 70vh)', aspectRatio: '1/1' }}
                >
                    {board.map((cell, i) => (
                        <div
                            key={i}
                            onClick={() => isXNext && handleClick(i)}
                            className={cn(
                                "flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer",
                                i === cursorPos && isXNext && !winner ? 'bg-slate-700 ring-4 ring-red-500 scale-105 z-10 shadow-lg' : 'bg-slate-800',
                                cell === 'X' ? 'text-red-500' : 'text-blue-500',
                                !isXNext && !winner ? 'opacity-70 pointer-events-none' : '',
                                winner && 'pointer-events-none'
                            )}
                        >
                            {cell === 'X' && <X className="w-1/2 h-1/2" strokeWidth={3} />}
                            {cell === 'O' && <Circle className="w-1/2 h-1/2" strokeWidth={4} />}
                            {i === cursorPos && isXNext && !cell && !winner && (
                                <div className="w-4 h-4 rounded-full opacity-40 bg-red-500 animate-pulse" />
                            )}
                        </div>
                    ))}

                    {/* Winner Overlay */}
                    {winner && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20 animate-in fade-in zoom-in">
                            <div className={cn(
                                "p-6 rounded-2xl flex flex-col items-center gap-4",
                                winner === "X" ? "bg-emerald-900/50 border border-emerald-500/50" :
                                    winner === "Draw" ? "bg-amber-900/50 border border-amber-500/50" :
                                        "bg-rose-900/50 border border-rose-500/50"
                            )}>
                                <span className="text-5xl">
                                    {winner === "X" ? "🎉" : winner === "Draw" ? "🤝" : "💻"}
                                </span>
                                <h3 className="text-2xl font-black text-white">
                                    {winner === "X" ? "BẠN THẮNG!" : winner === "Draw" ? "HÒA!" : "MÁY THẮNG!"}
                                </h3>
                                <div className="text-3xl font-black text-emerald-400">+{roundScore}</div>
                                <Button
                                    onClick={startNewRound}
                                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-xl"
                                >
                                    VÁN TIẾP THEO
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, color, icon }) {
    return (
        <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md flex flex-col items-center justify-center">
            <div className={cn("flex items-center gap-1 mb-1", color)}>
                {icon}
                <span className="text-[9px] font-black tracking-wider">{label}</span>
            </div>
            <span className={cn("text-lg font-mono font-black", color)}>{value}</span>
        </div>
    );
}
