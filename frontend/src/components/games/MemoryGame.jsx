import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { gameService } from "@/services/gameService";

const ICONS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];

export default function MemoryGame() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedIndices, setMatchedIndices] = useState([]);
    const [cursorPos, setCursorPos] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await gameService.getGameBySlug("memory");
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

    const initGame = useCallback(() => {
        const pairs = [...ICONS, ...ICONS];
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        setCards(pairs);
        setFlippedIndices([]);
        setMatchedIndices([]);
        setCursorPos(0);
        setIsChecking(false);
    }, [config]);

    useEffect(() => {
        if (!loading) {
            initGame();
        }
    }, [loading, initGame]);

    // Handle Match Logic
    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [first, second] = flippedIndices;

            if (cards[first] === cards[second]) {
                setMatchedIndices(prev => [...prev, first, second]);
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                const timer = setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [flippedIndices, cards]);

    // Win Condition
    useEffect(() => {
        if (cards.length > 0 && matchedIndices.length === cards.length) {
            toast({
                title: "VICTORY!",
                description: "Bạn có trí nhớ siêu phàm!",
                className: "bg-purple-600 text-white border-none"
            });
        }
    }, [matchedIndices, cards, toast]);

    // --- CONTROLS ---
    const handleKeyDown = useCallback((e) => {
        if (loading) return;
        if (matchedIndices.length === cards.length) {
            if (e.key === "Enter" || e.key === "Escape") initGame();
            return;
        }

        switch (e.key) {
            // 1. Navigation
            case "ArrowRight":
                setCursorPos(prev => (prev + 1) % 16);
                break;
            case "ArrowLeft":
                setCursorPos(prev => (prev - 1 + 16) % 16);
                break;

            // 2. Action: Flip
            case "Enter":
                if (isChecking) return;
                if (flippedIndices.length < 2 && !flippedIndices.includes(cursorPos) && !matchedIndices.includes(cursorPos)) {
                    setFlippedIndices(prev => [...prev, cursorPos]);
                }
                break;

            // 3. Hint: Peek all cards for 0.5s
            case "h": case "H":
                if (isChecking) return;
                toast({ title: "Quick Peek!", description: "Ghi nhớ nhanh nhé!" });
                const unrevealed = cards.map((_, i) => !matchedIndices.includes(i) ? i : null).filter(i => i !== null);
                const tempElement = document.getElementById("memory-grid");
                if (tempElement) tempElement.classList.add("reveal-all");
                setTimeout(() => {
                    if (tempElement) tempElement.classList.remove("reveal-all");
                }, 500);
                break;

            // 4. Back
            case "Escape":
                navigate("/home");
                break;
        }
    }, [loading, cards, flippedIndices, isChecking, matchedIndices, cursorPos, initGame, navigate, toast]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-purple-500 w-12 h-12" /></div>;

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-xl font-bold text-slate-300 flex items-center gap-2">
                <Brain className="text-purple-400" /> Pairs Found: {matchedIndices.length / 2} / 8
            </div>

            <div
                id="memory-grid"
                className="grid grid-cols-4 gap-3 bg-slate-800 p-4 rounded-xl shadow-2xl [&.reveal-all_div_span]:opacity-100 [&.reveal-all_div]:bg-purple-900"
            >
                {cards.map((icon, i) => {
                    const isFlipped = flippedIndices.includes(i);
                    const isMatched = matchedIndices.includes(i);
                    const isRevealed = isFlipped || isMatched;
                    const isCursor = i === cursorPos;

                    return (
                        <div
                            key={i}
                            className={`
                w-16 h-16 rounded-lg flex items-center justify-center text-3xl transition-all duration-300 cursor-pointer border-2
                ${isCursor ? 'border-yellow-400 scale-110 z-10 shadow-[0_0_15px_#facc15]' : 'border-slate-600'}
                ${isMatched ? 'bg-emerald-600/20 border-emerald-500' : ''}
                ${isFlipped ? 'bg-indigo-600 border-indigo-400 rotate-y-180' : 'bg-slate-700'}
              `}
                        >
                            <span className={`transition-opacity duration-200 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
                                {icon}
                            </span>

                            {!isRevealed && (
                                <HelpCircle className="w-6 h-6 text-slate-600 absolute" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
