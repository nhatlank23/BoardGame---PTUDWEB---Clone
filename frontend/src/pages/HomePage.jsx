import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import { gameService } from "@/services/gameService";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách game đang hoạt động (is_active = true)
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await gameService.getActiveGames();
        
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

    fetchGames();
  }, [toast]);

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Danh sách Game</h1>
            <p className="text-muted-foreground">Chọn game và bắt đầu chơi ngay</p>
          </div>
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Đang tải danh sách game...</p>
            </div>
          )}

          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">Chưa có game nào khả dụng</p>
                </div>
              ) : (
                games.map((game) => {
                  const config = typeof game.config === 'string' ? JSON.parse(game.config) : (game.config || {});
                  
                  return (
                    <Card key={game.id} className="overflow-hidden group hover:shadow-xl transition-all">
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                        {config.image && (
                          <img
                            src={config.image}
                            alt={game.name}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                          />
                        )}
                        {config.category && (
                          <Badge className="absolute top-3 right-3">{config.category}</Badge>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle>{game.name}</CardTitle>
                        <CardDescription>
                          {config.description || "Trò chơi thú vị"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {config.players || "1 người"}
                          </span>
                          <Button asChild>
                            <Link to={`/game/${game.slug}/play`}>
                              <Play className="mr-2 h-4 w-4" />
                              Chơi ngay
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
