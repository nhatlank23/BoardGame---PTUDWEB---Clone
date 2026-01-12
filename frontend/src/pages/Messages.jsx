import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState(0)

  const conversations = [
    {
      id: 0,
      name: "ProGamer123",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "GG! Đấu lại nhé",
      time: "2m",
      unread: 2,
      online: true,
    },
    {
      id: 1,
      name: "MasterPlayer",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Chơi caro không?",
      time: "15m",
      unread: 0,
      online: true,
    },
    {
      id: 2,
      name: "GameLegend",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Thanks bro!",
      time: "1h",
      unread: 0,
      online: false,
    },
    {
      id: 3,
      name: "SkillMaster",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Được rồi",
      time: "3h",
      unread: 1,
      online: false,
    },
  ]

  const messages = [
    { id: 1, sender: "other", text: "Chào bạn!", time: "10:30" },
    { id: 2, sender: "me", text: "Chào, game hay phết!", time: "10:31" },
    { id: 3, sender: "other", text: "Ừa, đấu lại không?", time: "10:32" },
    { id: 4, sender: "me", text: "Ok luôn", time: "10:32" },
    { id: 5, sender: "other", text: "GG! Đấu lại nhé", time: "10:35" },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Tin nhắn</h1>
            <p className="text-muted-foreground">Trò chuyện với bạn bè</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[350px_1fr] h-[700px]">
                {/* Conversations List */}
                <div className="border-r">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm kiếm..." className="pl-9" />
                    </div>
                  </div>
                  <div className="overflow-y-auto h-[calc(700px-73px)]">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedChat(conv.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 border-b hover:bg-accent transition-colors",
                          selectedChat === conv.id && "bg-accent",
                        )}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={conv.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{conv.name[0]}</AvatarFallback>
                          </Avatar>
                          {conv.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold">{conv.name}</div>
                            <div className="text-xs text-muted-foreground">{conv.time}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground truncate">{conv.lastMessage}</div>
                            {conv.unread > 0 && (
                              <Badge
                                variant="default"
                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                              >
                                {conv.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={conversations[selectedChat].avatar || "/placeholder.svg"} />
                      <AvatarFallback>{conversations[selectedChat].name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{conversations[selectedChat].name}</div>
                      <div className="text-sm text-muted-foreground">
                        {conversations[selectedChat].online ? "Đang hoạt động" : "Offline"}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex", message.sender === "me" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          <div>{message.text}</div>
                          <div
                            className={cn(
                              "text-xs mt-1",
                              message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {message.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input placeholder="Nhập tin nhắn..." />
                      <Button size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

