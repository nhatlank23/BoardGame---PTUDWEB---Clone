import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Circle, MousePointer2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { gameService } from "@/services/gameService";

export default function CaroGame({ winCount = 5 }) {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ rows: 12, cols: 12, winCount: winCount });

    const [board, setBoard] = useState([]);
    const [isXNext, setIsXNext] = useState(true);
    const [cursorPos, setCursorPos] = useState(0);
    const [winner, setWinner] = useState(null);

    // --- 1. LẤY CONFIG TỪ API ---
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
                        winCount: apiConfig.winCount || winCount
                    });
                }
            } catch (error) {
                toast({ title: "Note", description: "Using default Caro config", className: "bg-slate-800 text-slate-400" });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [toast, winCount]);

    // Init Board
    useEffect(() => {
        if (!loading) {
            setBoard(Array(config.rows * config.cols).fill(null));
            setCursorPos(Math.floor((config.rows * config.cols) / 2));
        }
    }, [loading, config]);

    // --- WIN CHECK LOGIC ---
    const checkWin = useCallback((currentBoard, idx, player) => {
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

        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of directions) {
            if (count(dr, dc) + count(-dr, -dc) + 1 >= config.winCount) return true;
        }
        return false;
    }, [config]);

    // --- ACTIONS ---
    const handleMove = useCallback((idx) => {
        if (winner || board[idx]) return;

        const newBoard = [...board];
        const player = isXNext ? "X" : "O";
        newBoard[idx] = player;
        setBoard(newBoard);

        if (checkWin(newBoard, idx, player)) {
            setWinner(player);
            toast({ title: "Kết thúc!", description: `${player === 'X' ? 'Bạn' : 'Computer'} đã chiến thắng!`, className: "bg-emerald-600 text-white" });
        } else if (!newBoard.includes(null)) {
            setWinner("Draw");
            toast({ title: "Hòa!", description: "Bàn cờ đã đầy." });
        } else {
            setIsXNext(!isXNext);
        }
    }, [board, isXNext, winner, checkWin, toast]);

    // --- 2. CHẾ ĐỘ CHƠI VỚI COMPUTER (O) ---
    useEffect(() => {
        if (!isXNext && !winner && !loading) {
            const timer = setTimeout(() => {
                const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (emptyIndices.length > 0) {
                    const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                    handleMove(randomMove);
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner, board, loading, handleMove]);

    // --- CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (loading) return;
        if (winner) {
            if (e.key === "Enter" || e.key === "Escape") {
                setBoard(Array(config.rows * config.cols).fill(null));
                setWinner(null);
                setIsXNext(true);
            }
            return;
        }

        if (!isXNext) return;

        const total = config.rows * config.cols;
        switch (e.key) {
            case "ArrowRight": setCursorPos(prev => (prev + 1) % total); break;
            case "ArrowLeft": setCursorPos(prev => (prev - 1 + total) % total); break;
            case "Enter": handleMove(cursorPos); break;
            case "h": case "H":
                toast({ title: "Gợi ý", description: "Bấm mũi tên để di chuyển, Enter để đánh." });
                break;
            case "Escape":
                if (board.some(x => x !== null)) {
                    if (window.confirm("Thoát game?")) navigate("/home");
                } else {
                    navigate("/home");
                }
                break;
        }
    }, [loading, isXNext, board, winner, cursorPos, handleMove, navigate, toast, config]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full max-w-md text-slate-300 font-mono text-sm uppercase">
                <span className={winner ? 'text-emerald-400 font-bold' : ''}>
                    {winner === 'X' ? 'BẠN THẮNG!' : winner === 'O' ? 'COMPUTER THẮNG!' : winner === 'Draw' ? 'HÒA!' : `Mục tiêu: ${config.winCount} hàng`}
                </span>
                <span className={isXNext ? "text-red-500" : "text-blue-500 animate-pulse"}>
                    {isXNext ? "Lượt của bạn (X)" : "Computer đang nghĩ (O)..."}
                </span>
            </div>

            <div
                className={`grid gap-[2px] sm:gap-[3px] bg-slate-800 p-3 sm:p-4 rounded-xl border-4 border-slate-700 shadow-2xl transition-all duration-500 ${!isXNext && !winner ? 'opacity-80' : ''}`}
                style={{
                    gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                    width: 'fit-content',
                    maxWidth: '95vw'
                }}
            >
                {board.map((cell, i) => {
                    const isCursor = i === cursorPos;
                    const sizeClass = config.cols <= 10
                        ? "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                        : "w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10";

                    return (
                        <div
                            key={i}
                            className={`
                 ${sizeClass} flex items-center justify-center text-sm sm:text-2xl font-bold rounded transition-all
                 ${isCursor && isXNext && !winner ? 'bg-slate-600 ring-4 ring-yellow-400 z-10 scale-110 shadow-lg' : 'bg-slate-900'}
                 ${cell === 'X' ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : cell === 'O' ? 'text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : ''}
               `}
                        >
                            {cell === 'X' && <X className="w-2/3 h-2/3" strokeWidth={3} />}
                            {cell === 'O' && <Circle className="w-2/3 h-2/3" strokeWidth={3.5} />}
                            {isCursor && isXNext && !cell && !winner && <MousePointer2 size={16} className="text-yellow-400 opacity-60 absolute animate-pulse" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
