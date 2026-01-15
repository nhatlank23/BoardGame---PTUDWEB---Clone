import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { gameService } from "@/services/gameService";
import { useToast } from "@/hooks/use-toast";

export default function GameConfig() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [game, setGame] = useState(null);
  
  // Config fields
  const [gameName, setGameName] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [configJson, setConfigJson] = useState("{}");
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      
      const allGamesResponse = await gameService.getAllGamesForAdmin();
      if (allGamesResponse.status === "success") {
        const gameData = allGamesResponse.data.find(g => g.id === parseInt(gameId));
        
        if (!gameData) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy game",
            variant: "destructive",
          });
          navigate("/admin/games");
          return;
        }
        
        setGame(gameData);
        setGameName(gameData.name);
        setGameSlug(gameData.slug);
        
        const config = typeof gameData.config === 'string' 
          ? JSON.parse(gameData.config) 
          : (gameData.config || {});
        
        setConfigJson(JSON.stringify(config, null, 2));
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách game",
          variant: "destructive",
        });
        navigate("/admin/games");
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin game",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (value) => {
    setConfigJson(value);
    setJsonError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let configObject;
      try {
        configObject = JSON.parse(configJson);
      } catch (e) {
        setJsonError("JSON không hợp lệ: " + e.message);
        toast({
          title: "Lỗi",
          description: "Config JSON không hợp lệ",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      const response = await gameService.updateGame(game.id, {
        name: gameName,
        slug: gameSlug,
        config: configObject,
      });
      
      if (response.status === "success") {
        toast({
          title: "Thành công",
          description: "Đã lưu cấu hình game",
        });
        fetchGameData();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể lưu cấu hình",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving game config:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cấu hình game",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar isAdmin />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/admin/games">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Đang tải cấu hình...</p>
            </div>
          ) : game ? (
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình Game</CardTitle>
                <CardDescription>Chỉnh sửa thông số và cài đặt cho game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="game-name">Tên game</Label>
                  <Input 
                    id="game-name" 
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game-slug">Slug</Label>
                  <Input 
                    id="game-slug" 
                    value={gameSlug}
                    onChange={(e) => setGameSlug(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="config">
                    Cấu hình Game (JSON)
                    <span className="text-xs text-muted-foreground ml-2">
                      Mỗi game có config khác nhau
                    </span>
                  </Label>
                  <Textarea 
                    id="config" 
                    value={configJson}
                    onChange={(e) => handleConfigChange(e.target.value)}
                    placeholder='{"rows": 15, "cols": 15, "win": 5}'
                    className="font-mono text-sm min-h-[300px]"
                  />
                  {jsonError && (
                    <p className="text-sm text-red-500">{jsonError}</p>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold">Các trường phổ biến:</p>
                    <p>• <code className="bg-secondary px-1 rounded">times</code>: Mảng thời gian (phút) - VD: <code className="bg-secondary px-1 rounded">[5, 10, 20, 30]</code></p>
                    <p>• <code className="bg-secondary px-1 rounded">rows, cols, win</code>: Cho game Caro</p>
                    <p>• <code className="bg-secondary px-1 rounded">moves, bombs</code>: Cho game puzzle</p>
                    <p>• <code className="bg-secondary px-1 rounded">speed, level</code>: Cho game tốc độ</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1"
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/admin/games">Hủy</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy game</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
