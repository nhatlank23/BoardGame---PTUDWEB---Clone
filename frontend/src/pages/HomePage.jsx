import { Link } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";

export default function HomePage() {
  const games = [
    {
      id: "caro",
      name: "Caro",
      description: "Cờ caro 5 hàng cổ điển",
      image: "/caro-game-board.jpg",
      category: "Đối kháng",
      players: "2 người",
    },
    {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      description: "Trò chơi O X truyền thống",
      image: "/tic-tac-toe.png",
      category: "Đối kháng",
      players: "2 người",
    },
    {
      id: "snake",
      name: "Snake",
      description: "Rắn săn mồi kinh điển",
      image: "/snake-game-retro.jpg",
      category: "Hành động",
      players: "1 người",
    },
    {
      id: "candy-rush",
      name: "Candy Rush",
      description: "Xếp hình kẹo ngọt",
      image: "/candy-match-game.png",
      category: "Hành động",
      players: "1 người",
    },
    {
      id: "memory",
      name: "Memory Game",
      description: "Cờ lật hình trí nhớ",
      image: "/memory-card-game.png",
      category: "Trí tuệ",
      players: "1 người",
    },
    {
      id: "drawing",
      name: "Bản vẽ tự do",
      description: "Vẽ và đoán hình",
      image: "/drawing-game.png",
      category: "Trí tuệ",
      players: "1-2 người",
    },
  ];

  const recentGames = [
    { name: "Caro", time: "5 phút trước", score: "Thắng 3-2" },
    { name: "Snake", time: "1 giờ trước", score: "245 điểm" },
    { name: "Memory Game", time: "2 giờ trước", score: "18/20 đúng" },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Danh sách Game</h1>
            <p className="text-muted-foreground">
              Chọn game và bắt đầu chơi ngay
            </p>
          </div>

          {/* Recent Games */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Game chơi gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {recentGames.map((game) => (
                  <div
                    key={game.name}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{game.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {game.time}
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {game.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Games */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                className="overflow-hidden group hover:shadow-xl transition-all"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 right-3">
                    {game.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle>{game.name}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {game.players}
                    </span>
                    <Button asChild>
                      <Link to={`/game/${game.id}/settings`}>
                        <Play className="mr-2 h-4 w-4" />
                        Chơi ngay
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
