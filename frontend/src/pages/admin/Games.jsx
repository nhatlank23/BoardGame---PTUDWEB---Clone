import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { gameService } from "@/services/gameService";
import { useToast } from "@/hooks/use-toast";

export default function Games() {
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách tất cả games (bao gồm cả is_active = false)
  useEffect(() => {
    fetchAllGames();
  }, []);

  const fetchAllGames = async () => {
    try {
      setLoading(true);
      // Gọi API nhưng lấy tất cả games (không filter is_active)
      const response = await gameService.getAllGamesForAdmin();

      if (response.status === "success") {
        setGames(response.data);
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể tải danh sách game",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = async (gameId, currentStatus) => {
    try {
      // Cập nhật trạng thái is_active
      const response = await gameService.updateGame(gameId, {
        is_active: !currentStatus,
      });

      if (response.status === "success") {
        // Cập nhật state local
        setGames(
          games.map((game) =>
            game.id === gameId ? { ...game, is_active: !currentStatus } : game
          )
        );
        toast({
          title: "Thành công",
          description: `Đã ${!currentStatus ? 'bật' : 'tắt'} game`,
        });
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể cập nhật game",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling game:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái game",
        variant: "destructive",
      });
    }
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
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Đang tải danh sách game...</p>
                </div>
              ) : games.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Chưa có game nào trong hệ thống</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {games.map((game) => {
                    const config = typeof game.config === 'string' ? JSON.parse(game.config) : (game.config || {});

                    const getGameImage = (slug) => {
                      const imageMap = {
                        "drawing": "/drawing.jpg",
                        "tic-tac-toe": "/tic-tac-toe.jpg",
                        "snake": "/Snake_OG-logo.jpg",
                        "memory": "/memory-card-game.png",
                        "caro-5": "/caro-game.jpg",
                        "caro-4": "/caro-game.jpg",
                        "match-3": "/match-3.jpg"
                      };
                      return imageMap[slug] || config.image;
                    };

                    const displayImage = getGameImage(game.slug);

                    return (
                      <div
                        key={game.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="h-20 w-28 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={game.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-xl">{game.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{game.name}</h3>
                            <Badge variant="secondary" className="text-xs">{game.slug}</Badge>
                            {game.is_active ? (
                              <Badge variant="default" className="bg-green-500">
                                Hoạt động
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Tắt</Badge>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-sm text-muted-foreground">
                              {config.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {game.is_active ? "Bật" : "Tắt"}
                            </span>
                            <Switch
                              checked={game.is_active}
                              onCheckedChange={() => toggleGame(game.id, game.is_active)}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
