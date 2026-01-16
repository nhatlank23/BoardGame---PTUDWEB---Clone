import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, X, Circle, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { gameService } from "@/services/gameService";

export default function TicTacToeGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [cursorPos, setCursorPos] = useState(4);
    const [winner, setWinner] = useState(null);

    // --- 1. LẤY CONFIG TỪ API ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("tic-tac-toe");
                if (response.status === "success") {
                    setConfig(response.data.config);
                }
            } catch (error) {
                toast({ title: "Lỗi", description: "Không tải được cấu hình game", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [toast]);

    // --- LOGIC GAME ---
    const calculateWinner = (squares) => {
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
    };

    const handleClick = useCallback((i) => {
        if (winner || board[i]) return;

        const newBoard = [...board];
        newBoard[i] = isXNext ? "X" : "O";
        setBoard(newBoard);
        setIsXNext(!isXNext);

        const w = calculateWinner(newBoard);
        if (w) setWinner(w);
        else if (!newBoard.includes(null)) setWinner("Draw"); // Hòa
    }, [board, isXNext, winner]);

    // --- 2. CHẾ ĐỘ CHƠI VỚI COMPUTER (O) ---
    useEffect(() => {
        if (!isXNext && !winner && !loading) {
            const timer = setTimeout(() => {
                const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (emptyIndices.length > 0) {
                    const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                    handleClick(randomMove);
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner, board, loading, handleClick]);

    const handleKeyDown = useCallback((e) => {
        if (loading) return;
        if (winner) {
            if (e.key === "Enter" || e.key === "Escape") {
                setBoard(Array(9).fill(null));
                setWinner(null);
                setIsXNext(true);
            }
            return;
        }

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
                if (board.some(x => x !== null)) {
                    if (window.confirm("Chơi lại từ đầu?")) {
                        setBoard(Array(9).fill(null));
                        setIsXNext(true);
                    }
                } else {
                    navigate("/home");
                }
                break;
        }
    }, [loading, isXNext, board, winner, cursorPos, handleClick, navigate, toast]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-red-500 w-12 h-12" /></div>;

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="text-2xl font-bold font-mono tracking-widest uppercase">
                {winner ? (
                    <span className={winner === "X" ? "text-red-500" : winner === "O" ? "text-blue-500" : "text-slate-400"}>
                        {winner === "Draw" ? "Hòa!" : winner === "X" ? "Bạn Thắng!" : "Computer Thắng!"}
                    </span>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <span className={isXNext ? "text-red-500" : "text-blue-500"}>
                            {isXNext ? "Lượt của bạn (X)" : "Computer đang nghĩ (O)..."}
                        </span>
                        {!isXNext && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4 bg-slate-800 p-6 rounded-2xl shadow-2xl border-4 border-slate-700">
                {board.map((cell, i) => (
                    <div
                        key={i}
                        className={`
              w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center text-7xl font-black rounded-xl transition-all duration-300
              ${i === cursorPos && isXNext && !winner ? 'bg-slate-600 ring-8 ring-white scale-105 z-10 shadow-lg' : 'bg-slate-900'}
              ${cell === 'X' ? 'text-red-500' : 'text-blue-500'}
              ${!isXNext && !winner ? 'opacity-80' : ''}
            `}
                    >
                        {cell === 'X' && <X size={80} strokeWidth={3} />}
                        {cell === 'O' && <Circle size={72} strokeWidth={4} />}
                        {i === cursorPos && isXNext && !cell && !winner && (
                            <div className="w-5 h-5 rounded-full opacity-40 bg-red-500 animate-pulse" />
                        )}
                    </div>
                ))}
            </div>

            <div className="text-slate-500 text-sm font-mono mt-4 text-center">
                {isXNext ? "Dùng phím TRÁI/PHẢI để chọn ô. ENTER để đánh." : "Vui lòng đợi Computer..."}
            </div>
        </div>
    );
}
