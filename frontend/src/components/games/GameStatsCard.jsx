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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">

          {/* Score Box */}
          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-1.5 text-yellow-500/80 mb-1">
              <Trophy size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{statLabel}</span>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tighter drop-shadow-md">
              {(statValue ?? score).toString().padStart(4, '0')}
            </div>
          </div>

          {/* Time / Status Box (Placeholder for now since Logic handled elsewhere or generic) */}
          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 shadow-inner group">
            <div className="flex items-center gap-1.5 text-emerald-500/80 mb-1">
              <Target size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
            </div>
            <div className="text-xs font-bold text-emerald-100 bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/20">
              {status}
            </div>
          </div>

        </div>

      </div>
    </Card>
  );
}