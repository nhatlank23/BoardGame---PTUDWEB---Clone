import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trophy, TrendingUp, Clock } from "lucide-react";

export default function ProfilePage() {
  const achievements = [
    { name: "First Win", icon: "🏆", earned: true },
    { name: "Speed Master", icon: "⚡", earned: true },
    { name: "100 Games", icon: "🎮", earned: true },
    { name: "Perfect Score", icon: "💯", earned: false },
    { name: "Marathon", icon: "🏃", earned: false },
    { name: "Champion", icon: "👑", earned: false },
  ];

  const gameStats = [
    { game: "Caro", played: 45, wins: 28, losses: 17, winRate: "62%" },
    { game: "Snake", played: 120, record: 245, avgScore: 180 },
    { game: "Memory Game", played: 35, record: "18/20", avgScore: "15/20" },
  ];

  const recentMatches = [
    { game: "Caro", opponent: "Player123", result: "Thắng", date: "2 giờ trước" },
    { game: "Caro", opponent: "GameMaster", result: "Thua", date: "5 giờ trước" },
    { game: "Snake", opponent: "Solo", result: "245 pts", date: "1 ngày trước" },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src="/placeholder.svg?height=128&width=128" />
                  <AvatarFallback className="text-3xl">NV</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold">Nguyễn Văn A</h1>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-4">@nguyenvana</p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <div className="text-2xl font-bold">1,245</div>
                      <div className="text-muted-foreground">Tổng game</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">780</div>
                      <div className="text-muted-foreground">Thắng</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">62%</div>
                      <div className="text-muted-foreground">Tỉ lệ thắng</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">#45</div>
                      <div className="text-muted-foreground">Xếp hạng</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="achievements" className="space-y-6">
            <TabsList>
              <TabsTrigger value="achievements">
                <Trophy className="mr-2 h-4 w-4" />
                Thành tựu
              </TabsTrigger>
              <TabsTrigger value="stats">
                <TrendingUp className="mr-2 h-4 w-4" />
                Thống kê
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="mr-2 h-4 w-4" />
                Lịch sử
              </TabsTrigger>
            </TabsList>

            {/* Achievements */}
            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Thành tựu & Huy hiệu</CardTitle>
                  <CardDescription>Bộ sưu tập thành tựu của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.name}
                        className={`text-center p-4 rounded-lg border ${achievement.earned ? "bg-primary/5 border-primary" : "bg-muted/50 opacity-50"}`}
                      >
                        <div className="text-4xl mb-2">{achievement.icon}</div>
                        <div className="text-sm font-medium">{achievement.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats */}
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê theo game</CardTitle>
                  <CardDescription>Chi tiết hiệu suất của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gameStats.map((stat) => (
                      <div key={stat.game} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold text-lg">{stat.game}</div>
                          <div className="text-sm text-muted-foreground">{stat.played} ván đã chơi</div>
                        </div>
                        <div className="text-right">
                          {"wins" in stat ? (
                            <>
                              <div className="font-semibold">
                                {stat.wins}W - {stat.losses}L
                              </div>
                              <Badge variant="secondary">{stat.winRate} Tỉ lệ thắng</Badge>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold">Kỷ lục: {stat.record}</div>
                              <div className="text-sm text-muted-foreground">TB: {stat.avgScore}</div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử đấu</CardTitle>
                  <CardDescription>Các trận đấu gần đây của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMatches.map((match, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="font-semibold">{match.game}</div>
                          <div className="text-sm text-muted-foreground">vs {match.opponent}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={match.result === "Thắng" ? "default" : match.result === "Thua" ? "destructive" : "secondary"}>{match.result}</Badge>
                          <div className="text-sm text-muted-foreground">{match.date}</div>
                        </div>
                      </div>
                    ))}
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
