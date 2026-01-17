import { Clock, Trophy, Target, Zap, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GameStatsCard({
  timeLeft = 0,
  score = 0,
  gameName = "Unknown",
  status = "PLAYING",
  statLabel = "Score",
  statValue
}) {

  return (
    <Card className="relative overflow-hidden bg-slate-900/40 border-slate-700/50 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">

      {/* Background Decorative Elements matches Controller */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col gap-4 relative z-10">

        {/* Header: Game Name */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Running</span>
          </div>
          <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tighter uppercase">
            {gameName}
          </div>
        </div>

      </div>
    </Card>
  );
}