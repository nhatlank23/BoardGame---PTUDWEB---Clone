import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, UserPlus, Gamepad2, TrendingUp } from "lucide-react"

export default function Dashboard() {
  const stats = [
    { label: "Tổng User", value: "1,245", icon: Users, change: "+12%", trend: "up" },
    { label: "Online", value: "342", icon: UserCheck, change: "+5%", trend: "up" },
    { label: "User mới", value: "89", icon: UserPlus, change: "+23%", trend: "up" },
    { label: "Tổng game", value: "6", icon: Gamepad2, change: "0%", trend: "same" },
  ]

  const popularGames = [
    { name: "Caro", plays: 5420, percentage: 35 },
    { name: "Snake", plays: 4280, percentage: 28 },
    { name: "Memory Game", plays: 2890, percentage: 19 },
    { name: "Tic Tac Toe", plays: 2780, percentage: 18 },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar isAdmin />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Thống kê tổng quan hệ thống</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <TrendingUp className={`h-3 w-3 ${stat.trend === "up" ? "text-green-500" : ""}`} />
                      <span className={stat.trend === "up" ? "text-green-500" : ""}>{stat.change}</span>
                      <span>so với tháng trước</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Popular Games */}
            <Card>
              <CardHeader>
                <CardTitle>Game phổ biến</CardTitle>
                <CardDescription>Thống kê lượt chơi theo game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularGames.map((game) => (
                    <div key={game.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{game.name}</span>
                        <span className="text-muted-foreground">{game.plays} lượt</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${game.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                  <Select defaultValue="caro">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caro">Caro</SelectItem>
                      <SelectItem value="snake">Snake</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] flex items-end justify-between gap-2">
                  {[20, 35, 45, 60, 80, 95, 75, 85, 90, 70, 50, 40].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-all cursor-pointer"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{i * 2}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

