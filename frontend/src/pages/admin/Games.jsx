import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Edit, Eye } from "lucide-react";

export default function Games() {
  const [games, setGames] = useState([
    {
      id: "caro",
      name: "Caro",
      category: "Đối kháng",
      enabled: true,
      plays: 5420,
      image: "/caro-game.jpg",
    },
    {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      category: "Đối kháng",
      enabled: true,
      plays: 2780,
      image: "/tic-tac-toe.jpg",
    },
    {
      id: "snake",
      name: "Snake",
      category: "Hành động",
      enabled: true,
      plays: 4280,
      image: "/classic-snake-game.png",
    },
    {
      id: "candy-rush",
      name: "Candy Rush",
      category: "Hành động",
      enabled: false,
      plays: 890,
      image: "/candy-game.jpg",
    },
    {
      id: "memory",
      name: "Memory Game",
      category: "Trí tuệ",
      enabled: true,
      plays: 2890,
      image: "/memory-card-game.png",
    },
    {
      id: "drawing",
      name: "Bản vẽ tự do",
      category: "Trí tuệ",
      enabled: false,
      plays: 450,
      image: "/candy-game.jpg",
    },
  ]);

  const toggleGame = (gameId) => {
    setGames(
      games.map((game) =>
        game.id === gameId ? { ...game, enabled: !game.enabled } : game
      )
    );
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar isAdmin />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Quản lý Game</h1>
            <p className="text-muted-foreground">
              Bật/tắt và cấu hình các game
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Danh sách game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <img
                      src={game.image || "/placeholder.svg"}
                      alt={game.name}
                      className="h-20 w-28 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{game.name}</h3>

                        {game.enabled ? (
                          <Badge variant="default" className="bg-green-500">
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Tắt</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {game.plays.toLocaleString()} lượt chơi
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {game.enabled ? "Bật" : "Tắt"}
                        </span>
                        <Switch
                          checked={game.enabled}
                          onCheckedChange={() => toggleGame(game.id)}
                        />
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/games/${game.id}/config`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Chỉnh sửa
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
