import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, UserPlus, Gamepad2 } from "lucide-react"
import { adminService } from "@/services/adminService"

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    newUsers: 0,
    totalGames: 0,
  })

  const [gamesPlayed, setGamesPlayed] = useState([])
  const [hourlyActivity, setHourlyActivity] = useState([])
  const [selectedGame, setSelectedGame] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    loadHourlyActivity(selectedGame === "all" ? null : selectedGame)
  }, [selectedGame])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [statsResponse, gamesResponse] = await Promise.all([
        adminService.getStatsSummary(),
        adminService.getGamesPlayed(),
      ])

      console.log("Stats response:", statsResponse)
      console.log("Games played response:", gamesResponse)

      if (statsResponse?.data) {
        setStats(statsResponse.data)
      }

      if (gamesResponse?.data) {
        console.log("Setting gamesPlayed:", gamesResponse.data)
        setGamesPlayed(gamesResponse.data)
      }

      await loadHourlyActivity(null)
    } catch (err) {
      console.error("Error loading dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadHourlyActivity = async (gameId) => {
    try {
      const response = await adminService.getHourlyActivity(gameId)
      console.log("Hourly activity response:", response)
      if (response?.data) {
        console.log("Setting hourlyActivity:", response.data)
        setHourlyActivity(response.data)
      }
    } catch (err) {
      console.error("Error loading hourly activity:", err)
    }
  }

  const getMaxCount = () => {
    const max = Math.max(...hourlyActivity.map(h => h.count), 1)
    return max
  }

  return (
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Thống kê tổng quan hệ thống</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng User</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "..." : stats.totalUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "..." : stats.onlineUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">User mới (7 ngày)</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "..." : stats.newUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng game</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "..." : stats.totalGames}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Popular Games */}
            <Card>
              <CardHeader>
                <CardTitle>Game phổ biến</CardTitle>
                <CardDescription>Thống kê lượt chơi theo game</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">Đang tải...</div>
                ) : gamesPlayed.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Chưa có dữ liệu</div>
                ) : (
                  <div className="space-y-4">
                    {gamesPlayed.map((game) => {
                      const maxPlays = Math.max(...gamesPlayed.map(g => Number(g.plays)), 1)
                      const percentage = (Number(game.plays) / maxPlays) * 100
                      return (
                        <div key={game.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{game.name}</span>
                            <span className="text-muted-foreground">{game.plays} lượt</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hoạt động theo giờ</CardTitle>
                    <CardDescription>Thời điểm chơi trong ngày</CardDescription>
                  </div>
                  <Select value={selectedGame} onValueChange={setSelectedGame}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả game</SelectItem>
                      {gamesPlayed.map((game) => (
                        <SelectItem key={game.id} value={String(game.id)}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {hourlyActivity.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Chưa có dữ liệu</div>
                ) : (
                  <div className="h-[240px] flex items-end justify-between gap-1">
                  {hourlyActivity.map((data) => {
                    const maxCount = getMaxCount()
                    const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0
                    return (
                      <div key={data.hour} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-all cursor-pointer relative group"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.count} lượt
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{data.hour}h</span>
                      </div>
                    )
                  })}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
  )
}

