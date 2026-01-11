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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";

export default function RankingPage() {
  const [selectedGame, setSelectedGame] = useState("all");

  const topPlayers = [
    {
      rank: 1,
      name: "ProGamer123",
      avatar: "/placeholder.svg?height=40&width=40",
      score: 2450,
      wins: 145,
      trend: "up",
    },
    {
      rank: 2,
      name: "MasterPlayer",
      avatar: "/placeholder.svg?height=40&width=40",
      score: 2380,
      wins: 138,
      trend: "up",
    },
    {
      rank: 3,
      name: "GameLegend",
      avatar: "/placeholder.svg?height=40&width=40",
      score: 2310,
      wins: 132,
      trend: "same",
    },
    {
      rank: 4,
      name: "SkillMaster",
      avatar: "/placeholder.svg?height=40&width=40",
      score: 2250,
      wins: 128,
      trend: "down",
    },
    {
      rank: 5,
      name: "EliteGamer",
      avatar: "/placeholder.svg?height=40&width=40",
      score: 2180,
      wins: 125,
      trend: "up",
    },
    {
      rank: 6,
      name: "Nguyễn Văn A",
      avatar: "/placeholder.svg?height=40&width=40",
      score: 2050,
      wins: 118,
      trend: "up",
      isCurrentUser: true,
    },
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return (
          <div className="h-6 w-6 flex items-center justify-center font-bold text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

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
                <SelectItem value="caro">Caro</SelectItem>
                <SelectItem value="tictactoe">Tic Tac Toe</SelectItem>
                <SelectItem value="snake">Snake</SelectItem>
                <SelectItem value="memory">Memory Game</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="global" className="space-y-6">
            <TabsList>
              <TabsTrigger value="global">Toàn hệ thống</TabsTrigger>
              <TabsTrigger value="friends">Bạn bè</TabsTrigger>
              <TabsTrigger value="personal">Cá nhân</TabsTrigger>
            </TabsList>

            <TabsContent value="global">
              <Card>
                <CardHeader>
                  <CardTitle>Top người chơi</CardTitle>
                  <CardDescription>Bảng xếp hạng toàn hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPlayers.map((player) => (
                      <Link
                        key={player.rank}
                        to="/profile"
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                          player.isCurrentUser
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(player.rank)}
                        </div>
                        <Avatar>
                          <AvatarImage
                            src={player.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {player.wins} trận thắng
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {player.score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            điểm
                          </div>
                        </div>
                        {player.trend === "up" && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-500"
                          >
                            ↑
                          </Badge>
                        )}
                        {player.trend === "down" && (
                          <Badge
                            variant="secondary"
                            className="bg-red-500/10 text-red-500"
                          >
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
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có dữ liệu xếp hạng bạn bè
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Thành tích cá nhân</CardTitle>
                  <CardDescription>
                    Kỷ lục của bạn theo từng game
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">Caro</div>
                        <div className="text-sm text-muted-foreground">
                          Xếp hạng #12
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">1850</div>
                        <div className="text-xs text-muted-foreground">
                          điểm cao nhất
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">Snake</div>
                        <div className="text-sm text-muted-foreground">
                          Xếp hạng #8
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">245</div>
                        <div className="text-xs text-muted-foreground">
                          điểm kỷ lục
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
