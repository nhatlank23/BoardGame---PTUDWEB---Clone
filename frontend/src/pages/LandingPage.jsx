import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Gamepad2, Users, Trophy, MessageSquare, Play } from "lucide-react"

export default function LandingPage() {
  const features = [
    {
      icon: Gamepad2,
      title: "Nhiều thể loại game",
      description: "Caro, Tic Tac Toe, Snake, Memory Game và nhiều hơn nữa",
    },
    {
      icon: Users,
      title: "Chơi với bạn bè",
      description: "Kết nối và thi đấu với bạn bè của bạn",
    },
    {
      icon: Trophy,
      title: "Bảng xếp hạng",
      description: "Cạnh tranh để lên top và đạt thành tựu",
    },
    {
      icon: MessageSquare,
      title: "Trò chuyện",
      description: "Kết bạn, giao lưu và nhắn tin với người chơi khác",
    },
  ]

  const games = [
    {
      name: "Caro",
      image: "/caro-game.jpg",
      description: "Trò chơi cờ caro cổ điển 5 hàng, 4 hàng hay 3 hàng",
    },
    {
      name: "Snake",
      image: "/snake-game-retro.jpg",
      description: "Game rắn săn mồi kinh điển",
    },
    {
      name: "Memory Game",
      image: "/memory-card-game.png",
      description: "Thử thách trí nhớ với cờ lật hình",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            Chơi game cùng <span className="text-primary">Board Game</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Mỗi ván cờ là một thử thách. Chơi với máy, thắng bằng chiến thuật.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link to="/auth">
                <Play className="mr-2 h-5 w-5" />
                Chơi ngay nào
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Games Showcase */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Game tựa game nổi bật</h2>
          <div className="grid md:grid-cols-3 gap-2">
            {games.map((game) => (
              <Card key={game.name} className="pt-0 overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-2 px-6">
                  <h3 className="text-2xl font-bold mb-2">{game.name}</h3>
                  <p className="text-muted-foreground">{game.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Tính năng nổi bật</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title}>
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Bạn đã sẵn sàng bắt đầu?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Tham gia ngay và trải nghiệm những trò chơi tuyệt vời
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <Link to="/auth">Đăng ký miễn phí</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

