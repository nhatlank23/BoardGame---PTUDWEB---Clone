import { Clock, Trophy, Target, Zap, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GameStatsCard({ timeLeft = 0, score = 0, gameName = "Unknown", status = "PLAYING", statLabel = "Score", statValue }) {
  return (
    <Card className="relative overflow-hidden bg-card/80 border-border p-6 shadow-2xl backdrop-blur-xl ring-1 ring-border/50">
      {/* Background Decorative Elements matches Controller */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col gap-4 relative z-10">
        {/* Header: Game Name */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Running</span>
          </div>
          <div className="text-lg font-black text-foreground tracking-tighter uppercase">{gameName}</div>
        </div>
      </div>
    </Card>
  );
}
