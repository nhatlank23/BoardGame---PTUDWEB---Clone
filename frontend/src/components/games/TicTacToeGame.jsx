import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, X, Circle, Trophy, Clock, Frown, Target, Zap, User, Cpu, ChevronLeft, ChevronRight, CornerDownLeft, ArrowLeft, Lightbulb, HelpCircle, Save } from "lucide-react";
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

// Game instructions
const GAME_INSTRUCTIONS = [
    {
        title: "Bắt đầu & Thao tác",
        content: "Bạn sẽ cầm quân X và luôn được đi trước. Hãy CLICK vào bất kỳ ô trống nào trên bàn cờ 3x3 để đặt quân."
    },
    {
        title: "Đối thủ AI",
        content: "Sau mỗi lượt của bạn, máy (quân O) sẽ tự động đi trong vòng 0.5s. AI có khả năng chặn đường thắng của bạn, hãy cẩn thận!"
    },
    {
        title: "Cách để Thắng",
        content: "Bạn thắng khi xếp được 3 quân X thành một hàng ngang, hàng dọc hoặc đường chéo liên tiếp."
    },
    {
        title: "Kết thúc ván & Hòa",
        content: "Ván đấu kết thúc khi có người thắng hoặc khi 9 ô đã đầy (Hòa). Sau đó, hệ thống sẽ tự động làm mới bàn cờ để bạn tiếp tục ghi điểm."
    },
    {
        title: "Điểm số & Thời gian",
        content: "Thắng: +100đ. Hòa: 0đ. Bạn có tổng 60 giây. Hãy thắng thật nhanh để nhận thêm Bonus thời gian (lên đến +50đ/ván)."
    },
    {
        title: "Trợ giúp thông minh",
        content: "Nhấn nút 'Hint' nếu bạn gặp khó khăn. Ô cờ giúp bạn dễ thắng nhất hoặc chặn máy hiệu quả nhất sẽ nhấp nháy."
    }
];

export default function TicTacToeGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState(null);
    const [hintCell, setHintCell] = useState(null);

    // Timer & Score
    const [selectedTimeOption, setSelectedTimeOption] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300);
    const [totalGameTime, setTotalGameTime] = useState(300);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [roundScore, setRoundScore] = useState(0);
    const [playerMoves, setPlayerMoves] = useState(0);
    const [roundsPlayed, setRoundsPlayed] = useState(0);

    // Game state flags
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

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
                    const times = response.data.config?.times || [5, 10, 20];
                    setTimeLeft(times[0] * 60);
                    setTotalGameTime(times[0] * 60);
                }
            } catch (error) {
                toast({ title: "Lỗi", description: "Không tải được cấu hình game", variant: "destructive" });
                setConfig({ win: 3, cols: 3, rows: 3, times: [5, 10, 20] });
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

    // Find best move for hint
    const findBestMove = useCallback((squares) => {
        const emptyIndices = squares.map((v, i) => v === null ? i : null).filter(v => v !== null);
        if (emptyIndices.length === 0) return null;

        // Simple strategy: center -> corners -> edges
        if (squares[4] === null) return 4;
        const corners = [0, 2, 6, 8].filter(i => squares[i] === null);
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }, []);

    // --- SCORING ---
    // Thắng: +1, Thua: -1, Hòa: 0
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
    const saveRoundResult = useCallback(async (score) => {
        if (!gameId) return;
        try {
            await gameService.savePlayHistory({
                game_id: gameId,
                score: score, // -1, 0, or 1
                duration: elapsedTime
            });
        } catch (error) {
            console.error("Failed to save round result:", error);
        }
    }, [gameId, elapsedTime]);

    // --- HANDLE CLICK ON CELL ---
    const handleCellClick = useCallback((i) => {
        if (winner || board[i] || !gameStarted || gameEnded || !isXNext) return;

        setHintCell(null); // Clear hint

        const newBoard = [...board];
        newBoard[i] = "X";
        setBoard(newBoard);
        setIsXNext(false);
        setPlayerMoves(prev => prev + 1);

        const w = calculateWinner(newBoard);
        if (w) {
            setWinner(w);
            const { score, breakdown } = calculateRoundScore(w);
            setRoundScore(score);
            setTotalScore(prev => prev + score);
            setRoundsPlayed(prev => prev + 1);
            // Lưu kết quả ván ngay
            saveRoundResult(score);

            toast({
                title: "🎉 Bạn Thắng!",
                description: breakdown.join(" | "),
                className: "bg-emerald-600 border-none text-white"
            });
        } else if (!newBoard.includes(null)) {
            setWinner("Draw");
            const { score, breakdown } = calculateRoundScore("Draw");
            setRoundScore(score);
            setTotalScore(prev => prev + score);
            setRoundsPlayed(prev => prev + 1);
            // Lưu kết quả ván ngay
            saveRoundResult(score);

            toast({
                title: "🤝 Hòa!",
                description: breakdown.join(" | "),
                className: "bg-amber-600 border-none text-white"
            });
        }
    }, [board, isXNext, winner, gameStarted, gameEnded, calculateWinner, calculateRoundScore, saveRoundResult, toast]);

    // --- COMPUTER AI ---
    useEffect(() => {
        if (!isXNext && !winner && gameStarted && !gameEnded && !loading) {
            const timer = setTimeout(() => {
                const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (emptyIndices.length > 0) {
                    const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

                    const newBoard = [...board];
                    newBoard[randomMove] = "O";
                    setBoard(newBoard);
                    setIsXNext(true);

                    const w = calculateWinner(newBoard);
                    if (w) {
                        setWinner(w);
                        const { score, breakdown } = calculateRoundScore(w);
                        setRoundScore(score);
                        setTotalScore(prev => prev + score);
                        setRoundsPlayed(prev => prev + 1);
                        // Lưu kết quả ván ngay
                        saveRoundResult(score);

                        toast({
                            title: "💻 Máy Thắng!",
                            description: breakdown.join(" | "),
                            className: "bg-rose-600 border-none text-white"
                        });
                    } else if (!newBoard.includes(null)) {
                        setWinner("Draw");
                        const { score, breakdown } = calculateRoundScore("Draw");
                        setRoundScore(score);
                        setTotalScore(prev => prev + score);
                        setRoundsPlayed(prev => prev + 1);
                        // Lưu kết quả ván ngay
                        saveRoundResult(score);

                        toast({
                            title: "🤝 Hòa!",
                            description: breakdown.join(" | "),
                            className: "bg-amber-600 border-none text-white"
                        });
                    }
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner, board, loading, gameStarted, gameEnded, calculateWinner, calculateRoundScore, saveRoundResult, toast]);

    // --- TIMER ---
    useEffect(() => {
        if (!gameStarted || gameEnded || winner) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    clearInterval(elapsedRef.current);
                    // Hết giờ = Hòa, lưu kết quả và cho phép chơi lại
                    setWinner("TimeUp");
                    const { score, breakdown } = calculateRoundScore("TimeUp");
                    setRoundScore(score);
                    setTotalScore(prevScore => prevScore + score);
                    setRoundsPlayed(prev => prev + 1);
                    // Lưu kết quả ván (score = 0)
                    saveRoundResult(score);
                    // Không setGameEnded - cho phép chơi lại
                    toast({
                        title: "⏰ Hết giờ!",
                        description: "Ván đấu kết thúc hòa. " + breakdown.join(" | "),
                        className: "bg-amber-600 border-none text-white"
                    });
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
    }, [gameStarted, gameEnded, winner, calculateRoundScore, saveRoundResult, toast]);

    // --- KEYBOARD CONTROLS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (loading) return;

            const times = config?.times || [5, 10, 20];

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

            if (!gameEnded) {
                switch (e.key) {
                    case "h":
                    case "H":
                        e.preventDefault();
                        // Show hint inline
                        if (isXNext && !winner) {
                            const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                            if (emptyIndices.length > 0) {
                                let suggestion = null;
                                if (board[4] === null) suggestion = 4;
                                else {
                                    const corners = [0, 2, 6, 8].filter(i => board[i] === null);
                                    if (corners.length > 0) suggestion = corners[Math.floor(Math.random() * corners.length)];
                                    else suggestion = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
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
    }, [loading, gameStarted, gameEnded, selectedTimeOption, config, navigate, isXNext, winner, board]);

    // Handle back from config screen
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

    // --- 5 CONTROL BUTTONS HANDLERS ---

    const handleLeft = () => {
        if (!gameStarted) {
            setSelectedTimeOption(prev => Math.max(0, prev - 1));
        }
    };

    const handleRight = () => {
        if (!gameStarted) {
            const times = config?.times || [5, 10, 20];
            setSelectedTimeOption(prev => Math.min(times.length - 1, prev + 1));
        }
    };

    const handleEnter = () => {
        if (!gameStarted) {
            startGame(selectedTimeOption);
        }
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
        }
    };

    const handleHint = () => {
        if (!gameStarted) {
            setShowInstructions(true);
            return;
        }

        if (!isXNext || winner || gameEnded) return;

        const suggestion = findBestMove(board);
        if (suggestion !== null) {
            setHintCell(suggestion);
            toast({
                title: "💡 Gợi ý",
                description: `Ô đang nhấp nháy là nước đi tốt`,
                className: "bg-yellow-600 border-none text-white"
            });

            setTimeout(() => setHintCell(null), 3000);
        }
    };

    const handleNewRound = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsXNext(true);
        setPlayerMoves(0);
        setRoundScore(0);
        setHintCell(null);
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
                    isXNext,
                    playerMoves,
                    roundsPlayed,
                    timeLeft,
                    totalGameTime
                }),
                current_score: totalScore,
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
                setIsXNext(state.isXNext);
                setPlayerMoves(state.playerMoves || 0);
                setRoundsPlayed(state.roundsPlayed || 0);
                setTotalScore(session.current_score || 0);

                const savedTimeLeft = state.timeLeft || (state.totalGameTime - session.elapsed_time) || 300;
                setTimeLeft(savedTimeLeft);
                setTotalGameTime(state.totalGameTime || savedTimeLeft);
                setElapsedTime(session.elapsed_time || 0);

                setGameStarted(true);
                setWinner(null);

                toast({
                    title: "📥 Đã load game!",
                    description: `Điểm: ${session.current_score} | Thời gian còn: ${Math.floor(savedTimeLeft / 60)}:${String(savedTimeLeft % 60).padStart(2, '0')}`,
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
        const times = config?.times || [5, 10, 20];
        setSelectedTimeOption(timeIndex);
        const gameTime = times[timeIndex] * 60;
        setTimeLeft(gameTime);
        setTotalGameTime(gameTime);
        setElapsedTime(0);
        setTotalScore(0);
        setRoundsPlayed(0);
        setPlayerMoves(0);
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsXNext(true);
        setHintCell(null);
        setGameStarted(true);
        setGameEnded(false);
    };

    // --- LOADING STATE ---
    if (loading) return (
        <div className="flex flex-col h-full items-center justify-center gap-4">
            <Loader2 className="animate-spin text-red-500 w-12 h-12" />
            <span className="text-slate-400 font-mono animate-pulse">LOADING_TIC_TAC_TOE...</span>
        </div>
    );

    const times = config?.times || [5, 10, 20];

    // --- TIME SELECTION SCREEN ---
    if (!gameStarted && !gameEnded) {
        return (
            <div className="flex flex-col items-center gap-6 w-full h-full justify-center px-4 overflow-y-auto py-6">
                <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">TIC TAC TOE</h2>
                    </div>

                    <div className="flex gap-4 flex-wrap justify-center">
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
                    <Button onClick={handleLoad} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 rounded-xl" disabled={isLoadingSession}>
                        {isLoadingSession ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        Tiếp tục game đã lưu
                    </Button>

                    <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-yellow-400" />
                                    Hướng dẫn chơi Tic Tac Toe
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-4 text-slate-300 mt-4">
                                        {GAME_INSTRUCTIONS.map((item, idx) => (
                                            <div key={idx} className="border-l-2 border-blue-500 pl-3">
                                                <h4 className="text-white font-bold text-sm uppercase mb-1">
                                                    {idx + 1}. {item.title}
                                                </h4>
                                                <p className="text-xs leading-relaxed text-slate-400">
                                                    {item.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-500">Đã hiểu</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Lưu game trước khi thoát?</AlertDialogTitle>
                                <AlertDialogDescription>Bạn có muốn lưu tiến trình game hiện tại không?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={handleExitWithoutSave} className="bg-slate-800 text-white hover:bg-slate-700">Không lưu</AlertDialogCancel>
                                <AlertDialogAction onClick={handleExitWithSave} className="bg-emerald-600 hover:bg-emerald-500">Lưu và thoát</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        );
    }

    // --- GAME END SCREEN ---
    if (gameEnded) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full px-4 overflow-y-auto py-6">
                <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                    <div className={cn(
                        "p-10 rounded-3xl border-2 flex flex-col items-center gap-6",
                        totalScore > 0 ? "bg-emerald-900/30 border-emerald-500/50" : "bg-rose-900/30 border-rose-500/50"
                    )}>
                        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center", totalScore > 0 ? "bg-emerald-500/20" : "bg-rose-500/20")}>
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
                        <Button onClick={() => { setGameStarted(false); setGameEnded(false); }} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-12 py-6 rounded-2xl text-lg">
                            CHƠI LẠI
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN GAME SCREEN ---
    return (
        <div className="flex flex-col items-center w-full h-full px-4 py-4 overflow-y-auto">
            <div className="flex flex-col items-center gap-3 w-full max-w-2xl">

                <div className="grid grid-cols-4 w-full gap-2 flex-shrink-0">
                    <StatBox label="ĐIỂM" value={totalScore} color="text-emerald-400" icon={<Target className="w-4 h-4" />} />
                    <StatBox label="VÁN" value={roundsPlayed} color="text-violet-400" icon={<Zap className="w-4 h-4" />} />
                    <StatBox label="THỜI GIAN" value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`} color={timeLeft < 30 ? "text-rose-400 animate-pulse" : "text-amber-400"} icon={<Clock className="w-4 h-4" />} />
                    <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl flex items-center justify-center">
                        <div className={cn("flex items-center gap-2", isXNext ? "text-red-400" : "text-blue-400")}>
                            {isXNext ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                            <span className="font-bold text-xs">{isXNext ? "Lượt bạn" : "Lượt máy"}</span>
                            {!isXNext && !winner && <Loader2 className="w-3 h-3 animate-spin" />}
                        </div>
                    </div>
                </div>


                {/* Game Board */}
                <div className="relative flex-shrink-0 w-full flex justify-center">
                    <div className="absolute -inset-4 bg-red-500/10 rounded-3xl blur-2xl" />
                    <div className="relative grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-2xl shadow-2xl border-4 border-slate-700"
                        style={{ width: 'min(80vw, 50vh, 500px)', aspectRatio: '1/1' }}
                    >
                        {board.map((cell, i) => (
                            <div
                                key={i}
                                onClick={() => handleCellClick(i)}
                                className={cn(
                                    "flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer border-2",
                                    cell === null && isXNext && !winner ? "bg-slate-800 hover:bg-slate-700 border-slate-700" : "border-transparent",
                                    cell === 'X' && "bg-red-500/20 border-red-500",
                                    cell === 'O' && "bg-blue-500/20 border-blue-500",
                                    hintCell === i && "ring-4 ring-yellow-400 animate-pulse",
                                    (!isXNext || winner) && cell === null && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {cell === 'X' && <X className="w-1/2 h-1/2 text-red-500" strokeWidth={3} />}
                                {cell === 'O' && <Circle className="w-1/2 h-1/2 text-blue-500" strokeWidth={4} />}
                            </div>
                        ))}

                        {winner && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20 animate-in fade-in zoom-in">
                                <div className={cn(
                                    "p-6 rounded-2xl flex flex-col items-center gap-4",
                                    winner === "X" ? "bg-emerald-900/50 border border-emerald-500/50" :
                                        winner === "Draw" ? "bg-amber-900/50 border border-amber-500/50" :
                                            "bg-rose-900/50 border border-rose-500/50"
                                )}>
                                    <span className="text-5xl">{winner === "X" ? "🎉" : winner === "Draw" ? "🤝" : "💻"}</span>
                                    <h3 className="text-2xl font-black text-white">
                                        {winner === "X" ? "BẠN THẮNG!" : winner === "Draw" ? "HÒA!" : "MÁY THẮNG!"}
                                    </h3>
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
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 transition-all flex-shrink-0"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {isSaving ? "Đang lưu..." : "Lưu Game"}
                </Button>


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
        </div>
    );
}

function StatBox({ label, value, color, icon }) {
    return (
        <div className="bg-slate-900/60 border border-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-center min-h-[60px]">
            <div className={cn("flex items-center gap-1 mb-0.5", color)}>
                {icon}
                <span className="text-[9px] font-black tracking-wider">{label}</span>
            </div>
            <span className={cn("text-base font-mono font-black", color)}>{value}</span>
        </div>
    );
}
