import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Toast } from "../components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { gameService } from "../services/gameService";
import { rankingService } from "../services/rankingService";
import GamePagination from "../components/ui/GamePagination";

const PAGE_SIZE = 3;

export default function RankingPage() {
  const [selectedGame, setSelectedGame] = useState("");
  const [loading, setLoading] = useState(false);
  const [allGames, setAllGames] = useState([]);
  const [leaderboards, setLeaderboards] = useState([]);
  const [friendLeaderboards, setFriendLeaderboard] = useState([]);
  const [pageLeaderboards, setPageLeaderboards] = useState(1);
  const [totalPagesLeaderboards, setTotalPagesLeaderboards] = useState(1);
  const [pageFriendsLeaderboards, setFriendsPageLeaderboards] = useState(1);
  const [totalPagesFriendsLeaderboards, setTotalPagesFriendsLeaderboards] = useState(1);


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
          const games = response.data;
          setAllGames(games);
          // Tự động chọn game đầu tiên nếu chưa có selection
          if (games.length > 0 && !selectedGame) {
            setSelectedGame(games[0].id.toString());
          }
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
      // Don't fetch if no game is selected
      if (!selectedGame) return;

      try {
        setLoading(true);
        const response = await rankingService.getTopFriendLeaderBoard(selectedGame, pageFriendsLeaderboards, PAGE_SIZE);
        // console.log("Friend Leaderboard response:", response);
        if (response.status === "success") {
          setFriendLeaderboard(response.data);
          if (response.pagination) {
            setTotalPagesFriendsLeaderboards(response.pagination.totalPages || 1);
          }
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
      // Don't fetch if no game is selected
      if (!selectedGame) return;

      try {
        setLoading(true);
        const response = await rankingService.getTopLeaderBoard(selectedGame, pageLeaderboards, PAGE_SIZE);
        if (response.status === "success") {
          setLeaderboards(response.data);
          if (response.pagination) {
            setTotalPagesLeaderboards(response.pagination.totalPages || 1);
          }
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
                <SelectItem key={i} value={game.id.toString()}>
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
                        {leaderboards.filter(leaderboard => leaderboard.name !== "Admin").map((leaderboard, i) => (
                          <Link
                            key={i}
                            to={`/profile/${leaderboard.user_id}`}
                            // Todo: kiểm tra user hiện tại có trên bảng không
                            className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${false ? "bg-primary/5 border-primary" : "hover:bg-accent"
                              }`}
                          >
                            <div className="w-8 flex justify-center">{getRankIcon(i + 1)}</div>
                            <Avatar>
                              <AvatarImage src={leaderboard.avatar_url || "public/placeholder-user.jpg"} />
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-semibold">{leaderboard.name}</div>
                              <div className="text-sm text-muted-foreground">{leaderboard.wins ?? 0} trận thắng</div>
                            </div>
                            <div className="text-right">
                              {/* Game PvP (record <= 1): hiển thị tỷ lệ thắng */}
                              {leaderboard.record <= 1 ? (
                                <div className="text-2xl font-bold">{leaderboard.win_rate ?? 0}%</div>
                              ) : (
                                <>
                                  <div className="text-2xl font-bold">{leaderboard.avg_score}</div>
                                  <div className="text-xs text-muted-foreground">điểm</div>
                                </>
                              )}
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
                <GamePagination
                  currentPage={pageLeaderboards}
                  totalPages={totalPagesLeaderboards}
                  onNextPage={() => {
                    if (pageLeaderboards >= totalPagesLeaderboards) return;
                    setPageLeaderboards((prev) => prev + 1);
                  }}
                  onPrevPage={() => {
                    setPageLeaderboards((prev) => {
                      if (prev <= 1) return prev;
                      return prev - 1;
                    });
                  }}
                  hasMore={pageLeaderboards < totalPagesLeaderboards}
                />
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
                        {friendLeaderboards.filter(leaderboard => leaderboard.name !== "Admin").map((leaderboard, i) => (
                          <Link
                            key={i}
                            to={`/profile/${leaderboard.user_id}`}
                            // Todo: kiểm tra user hiện tại có trên bảng không
                            className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${false ? "bg-primary/5 border-primary" : "hover:bg-accent"
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
                              {/* Game PvP (record = 1 hoặc -1): hiển thị tỷ lệ thắng, game điểm: hiển thị điểm */}
                              {leaderboard.record <= 1 ? (
                                <div className="text-2xl font-bold">{leaderboard.win_rate ?? 0}%</div>
                              ) : (
                                <>
                                  <div className="text-2xl font-bold">{leaderboard.avg_score}</div>
                                  <div className="text-xs text-muted-foreground">điểm</div>
                                </>
                              )}
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
                <GamePagination
                  currentPage={pageFriendsLeaderboards}
                  totalPages={totalPagesFriendsLeaderboards}
                  onNextPage={() => {
                    if (pageFriendsLeaderboards >= totalPagesFriendsLeaderboards) return;
                    setFriendsPageLeaderboards((prev) => prev + 1);
                  }}
                  onPrevPage={() => {
                    setFriendsPageLeaderboards((prev) => {
                      if (prev <= 1) return prev;
                      return prev - 1;
                    });
                  }}
                  hasMore={pageFriendsLeaderboards < totalPagesFriendsLeaderboards}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
