import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

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

      await loadHourlyActivity()
    } catch (err) {
      console.error("Error loading dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadHourlyActivity = async () => {
    try {
      const response = await adminService.getHourlyActivity(null)
      console.log("Hourly activity response:", response)
      if (response?.data) {
        console.log("Setting hourlyActivity:", response.data)
        console.log("Array length:", response.data.length)
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

  const getTimeSlots = () => {
    if (hourlyActivity.length === 0) return []

    const slots = [
      { label: "0h - 7h", range: [0, 6], icon: "🌙" },
      { label: "7h - 12h", range: [7, 11], icon: "☀️" },
      { label: "12h - 17h", range: [12, 16], icon: "🌤️" },
      { label: "17h - 20h", range: [17, 19], icon: "🌆" },
      { label: "20h - 24h", range: [20, 23], icon: "🌃" },
    ]

    return slots.map(slot => {
      const count = hourlyActivity
        .filter(h => h.hour >= slot.range[0] && h.hour <= slot.range[1])
        .reduce((sum, h) => sum + h.count, 0)
      
      return {
        label: slot.label,
        icon: slot.icon,
        count
      }
    })
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
                <CardTitle>Hoạt động theo giờ (7 ngày)</CardTitle>
                <CardDescription>Tổng lượt chơi theo từng giờ trong ngày</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlyActivity.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Chưa có dữ liệu</div>
                ) : (
                  <div className="space-y-3">
                    {getTimeSlots().map((slot, index) => {
                      const maxCount = Math.max(...getTimeSlots().map(s => s.count), 1)
                      const width = maxCount > 0 ? (slot.count / maxCount) * 100 : 0
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-28">
                            <span className="text-lg">{slot.icon}</span>
                            <span className="text-xs font-medium text-muted-foreground">{slot.label}</span>
                          </div>
                          <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all flex items-center justify-end pr-3 group hover:bg-primary/80"
                              style={{ width: `${Math.max(width, 3)}%` }}
                            >
                              <span className="text-sm font-bold text-primary-foreground">
                                {slot.count}
                              </span>
                            </div>
                          </div>
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

