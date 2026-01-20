import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toast } from "../components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { gameService } from "../services/gameService";
import { rankingService } from "../services/rankingService";
import Pagination from "../components/ui/paginatio";

const PAGE_SIZE = 50;

export default function RankingPage() {
  const [selectedGame, setSelectedGame] = useState("");
  const [loading, setLoading] = useState(false);
  const [allGames, setAllGames] = useState([]);
  const [leaderboards, setLeaderboards] = useState([]);
  const [friendLeaderboards, setFriendLeaderboard] = useState([]);
  const [pageLeaderboards, setPageLeaderboards] = useState(1);
  const [pageFriendsLeaderboards, setFriendsPageLeaderboards] = useState(1);

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
          Toast({ title: "Lỗi", description: "Không tải được dữ liệu game", variant: "destructive" });
        }
      } catch (error) {
        Toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
      }
    };

    fetchAllGames();
  }, []);

  useEffect(() => {
    const fetchFriendLeaderboards = async () => {
      try {
        setLoading(true);
        const response = await rankingService.getTopFriendLeaderBoard(selectedGame, pageFriendsLeaderboards, PAGE_SIZE);
        if (response.status === "success") {
          setFriendLeaderboard(response.data);
        } else {
          Toast({ title: "Lỗi", description: "Không tải được dữ liệu bảng xếp hạng", variant: "destructive" });
        }
      } catch (error) {
        Toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchFriendLeaderboards();
  }, [selectedGame, pageFriendsLeaderboards]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true);
        const response = await rankingService.getTopLeaderBoard(selectedGame, pageLeaderboards, PAGE_SIZE);
        if (response.status === "success") {
          setLeaderboards(response.data);
        } else {
          Toast({ title: "Lỗi", description: "Không tải được dữ liệu bảng xếp hạng", variant: "destructive" });
        }
      } catch (error) {
        Toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [selectedGame, pageLeaderboards]);

  return (
    <main className="p-8 px-32">
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
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Đang tải...</p>
                  ) : (
                    <>
                      {leaderboards.length > 0 ? (
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
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold">{leaderboard.name}</div>
                                <div className="text-sm text-muted-foreground">{leaderboard.wins ?? 0} trận thắng</div>
                              </div>
                              <div className="text-right">
                                <>
                                  {leaderboard.avg_score === 1 || leaderboard.avg_score === -1 ? (
                                    <>
                                      <div className="text-2xl font-bold">{leaderboard.win_rate ?? 0}%</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-2xl font-bold">{leaderboard.avg_score}</div>
                                      <div className="text-xs text-muted-foreground">điểm</div>
                                    </>
                                  )}
                                </>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Không có dữ liệu</p>
                      )}
                    </>
                  )}
                  {/* Phân trang */}
                  <Pagination
                    currentPage={pageLeaderboards}
                    onNextPage={() => {
                      if (leaderboards.length < PAGE_SIZE) return;
                      setPageLeaderboards((prev) => prev + 1);
                    }}
                    onPrevPage={() => {
                      setPageLeaderboards((prev) => {
                        if (prev <= 1) return prev;
                        return prev - 1;
                      });
                    }}
                  ></Pagination>
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
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Đang tải...</p>
                  ) : (
                    <>
                      {friendLeaderboards.length > 0 ? (
                        <div className="space-y-3">
                          {friendLeaderboards.map((leaderboard, i) => (
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
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold">{leaderboard.name}</div>
                                <div className="text-sm text-muted-foreground">{leaderboard.wins ?? 0} trận thắng</div>
                              </div>
                              <div className="text-right">
                                <>
                                  {leaderboard.avg_score === 1 || leaderboard.avg_score === -1 ? (
                                    <>
                                      <div className="text-2xl font-bold">{leaderboard.win_rate ?? 0}%</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-2xl font-bold">{leaderboard.avg_score}</div>
                                      <div className="text-xs text-muted-foreground">điểm</div>
                                    </>
                                  )}
                                </>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Không có dữ liệu</p>
                      )}
                    </>
                  )}
                  {/* Phân trang */}
                  <Pagination
                    currentPage={pageFriendsLeaderboards}
                    onNextPage={() => {
                      if (friendLeaderboards.length < PAGE_SIZE) return;
                      setFriendsPageLeaderboards((prev) => prev + 1);
                    }}
                    onPrevPage={() => {
                      setFriendsPageLeaderboards((prev) => {
                        if (prev <= 1) return prev;
                        return prev - 1;
                      });
                    }}
                  ></Pagination>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
  );
}
