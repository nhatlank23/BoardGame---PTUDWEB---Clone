import { ArrowLeft, ArrowRight, CornerDownRight, Lightbulb, Undo2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GameController() {
    const simulateKeyPress = (key) => {
        const event = new KeyboardEvent("keydown", {
            key: key,
            bubbles: true,
            cancelable: true,
        });
        window.dispatchEvent(event);
    };

    return (
        <Card className="relative overflow-hidden bg-slate-900/40 border-slate-700/50 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Gamepad2 size={14} className="text-emerald-500" /> Controller
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                </div>

                <div className="flex justify-between px-2">
                    <ControlButton
                        icon={<Undo2 size={18} />}
                        label="Back"
                        subLabel="ESC"
                        colorClass="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border-rose-500/20"
                        onClick={() => simulateKeyPress("Escape")}
                    />
                    <ControlButton
                        icon={<Lightbulb size={18} />}
                        label="Hint"
                        subLabel="H"
                        colorClass="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 border-amber-500/20"
                        onClick={() => simulateKeyPress("h")}
                    />
                </div>

                <div className="flex items-end justify-between gap-4 mt-2">
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 shadow-inner flex gap-2">
                        <NavButton
                            icon={<ArrowLeft size={28} />}
                            onClick={() => simulateKeyPress("ArrowLeft")}
                        />
                        <NavButton
                            icon={<ArrowRight size={28} />}
                            onClick={() => simulateKeyPress("ArrowRight")}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500" />
                        <Button
                            className="relative h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 border-4 border-slate-900/50 active:scale-95 transition-all shadow-xl flex flex-col items-center justify-center gap-1 group-active:shadow-none"
                            onClick={() => simulateKeyPress("Enter")}
                        >
                            <CornerDownRight size={36} className="text-white drop-shadow-md" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/90 text-shadow-sm">Enter</span>
                        </Button>
                    </div>

                </div>

                <div className="text-center">
                    <span className="text-sm font-mono text-slate-500 bg-slate-950/30 px-3 py-1 rounded-full border border-white/5">
                        Hỗ trợ chuột/ bàn phím
                    </span>
                </div>
            </div>
        </Card>
    );
}

function ControlButton({ icon, label, subLabel, onClick, colorClass }) {
    return (
        <Button
            variant="ghost"
            className={cn(
                "flex flex-col h-auto p-3 gap-2 transition-all duration-300 rounded-xl border bg-slate-800/40 backdrop-blur-sm group hover:-translate-y-1",
                colorClass
            )}
            onClick={onClick}
        >
            <div className="p-1.5 rounded-md bg-black/20 shadow-inner group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="flex flex-col items-center leading-none gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</span>
                <span className="text-[8px] font-mono opacity-60">[{subLabel}]</span>
            </div>
        </Button>
    );
}

function NavButton({ icon, onClick }) {
    return (
        <Button
            className="h-16 w-16 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 active:bg-slate-800 transition-all shadow-lg hover:shadow-cyan-500/20"
            onClick={onClick}
        >
            {icon}
        </Button>
    );
}
