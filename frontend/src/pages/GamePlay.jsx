import { useParams } from "react-router-dom";
import DrawingGame from "@/components/games/DrawingGame";
import TicTacToeGame from "@/components/games/TicTacToeGame";
import { GameStatsCard } from "@/components/games/GameStatsCard";
import { GameController } from "@/components/games/GameController";
import SnakeGame from "@/components/games/SnakeGame";
import MemoryGame from "@/components/games/MemoryGame";
import CaroGame from "@/components/games/CaroGame";
import Match3Game from "@/components/games/Match3Game";

export default function GamePlay() {
  const { slug } = useParams();

  const renderGameContent = () => {
    switch (slug) {
      case "drawing": return <DrawingGame />;
      case "tic-tac-toe": return <TicTacToeGame />;
      case "snake": return <SnakeGame />;
      case "memory": return <MemoryGame />;
      case "caro-5": return <CaroGame winCount={5} />;
      case "caro-4": return <CaroGame winCount={4} />;
      case "match-3": return <Match3Game />;
      default: return (
        <div className="flex flex-col items-center justify-center text-slate-500">
          <p className="text-2xl font-mono">GAME_NOT_FOUND</p>
          <p className="text-sm">Vui lòng quay lại Menu chính</p>
        </div>
      );
    }
  };

  return (
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">

          <div className="col-span-8 flex flex-col bg-card rounded-3xl border border-border shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 radial-gradient opacity-20 pointer-events-none" />

            <div className="relative z-10 flex-1 flex items-center justify-center overflow-y-auto">
              {renderGameContent()}
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6 min-h-0">
            <div className="flex-shrink-0">
              <GameStatsCard
                gameName={slug?.toUpperCase().replace("-", " ")}
                status="ACTIVE"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
              <GameController />
            </div>
          </div>

        </div>
      </main>
  );
}