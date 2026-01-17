import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { gameService } from "../services/gameService";
import { rankingService } from "../services/rankingService";

export default function RankingPage() {
  const [selectedGame, setSelectedGame] = useState("all");
  const [loading, setLoading] = useState(false);
  const [allGames, setAllGames] = useState([]);
  const [leaderboards, setLeaderboards] = useState([]);

  // const topPlayers = [
  //   {
  //     rank: 1,
  //     name: "ProGamer123",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //     score: 2450,
  //     wins: 145,
  //     trend: "up",
  //   },
  //   {
  //     rank: 2,
  //     name: "MasterPlayer",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //     score: 2380,
  //     wins: 138,
  //     trend: "up",
  //   },
  //   {
  //     rank: 3,
  //     name: "GameLegend",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //     score: 2310,
  //     wins: 132,
  //     trend: "same",
  //   },
  //   {
  //     rank: 4,
  //     name: "SkillMaster",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //     score: 2250,
  //     wins: 128,
  //     trend: "down",
  //   },
  //   {
  //     rank: 5,
  //     name: "EliteGamer",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //     score: 2180,
  //     wins: 125,
  //     trend: "up",
  //   },
  //   {
  //     rank: 6,
  //     name: "Nguyễn Văn A",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //     score: 2050,
  //     wins: 118,
  //     trend: "up",
  //     isCurrentUser: true,
  //   },
  // ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <div className="h-6 w-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</div>;
    }
  };

  useLayoutEffect(() => {
    const fetchAllGames = async () => {
      try {
        const response = await gameService.getActiveGames();
        if (response.status === "success") {
          setAllGames(response.data);
        } else {
          toast({ title: "Lỗi", description: "Không tải được dữ liệu game", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
      }
    };

    fetchAllGames();
  }, []);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true);
        const response = await rankingService.getTopLeaderBoard(selectedGame);
        if (response.status === "success") {
          setLeaderboards(response.data);
        } else {
          toast({ title: "Lỗi", description: "Không tải được dữ liệu bảng xếp hạng", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [selectedGame]);

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Bảng xếp hạng</h1>
            <p className="text-muted-foreground">Xem thứ hạng cao thủ</p>
          </div>

          <div className="flex gap-4 mb-6">
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả game</SelectItem>
                {allGames.map((game, i) => (
                  <SelectItem key={i} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="global" className="space-y-6">
            <TabsList>
              <TabsTrigger value="global">Toàn hệ thống</TabsTrigger>
              <TabsTrigger value="friends">Bạn bè</TabsTrigger>
            </TabsList>

            <TabsContent value="global">
              <Card>
                <CardHeader>
                  <CardTitle>Top người chơi</CardTitle>
                  <CardDescription>Bảng xếp hạng toàn hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards.map((leaderboard, i) => (
                      <Link
                        key={i}
                        to="/profile"
                        // Todo: kiểm tra user hiện tại có trên bảng không
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                          false ? "bg-primary/5 border-primary" : "hover:bg-accent"
                        }`}
                      >
                        <div className="w-8 flex justify-center">{getRankIcon(i + 1)}</div>
                        <Avatar>
                          <AvatarImage src={leaderboard.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{leaderboard.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{leaderboard.username}</div>
                          <div className="text-sm text-muted-foreground">{leaderboard.wins ?? 0} trận thắng</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{leaderboard.high_score}</div>
                          <div className="text-xs text-muted-foreground">điểm</div>
                        </div>
                        {leaderboard.trend === "up" && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            ↑
                          </Badge>
                        )}
                        {leaderboard.trend === "down" && (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                            ↓
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle>Bạn bè</CardTitle>
                  <CardDescription>Xếp hạng của bạn bè</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu xếp hạng bạn bè</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
