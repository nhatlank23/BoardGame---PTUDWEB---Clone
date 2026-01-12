import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Check, X } from "lucide-react";

export default function FriendsPage() {
  const friends = [
    {
      name: "ProGamer123",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
      game: "Đang chơi Caro",
    },
    {
      name: "MasterPlayer",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
      game: "Đang chơi Snake",
    },
    {
      name: "GameLegend",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
      game: "",
    },
    {
      name: "SkillMaster",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
      game: "",
    },
  ];

  const friendRequests = [
    {
      name: "NewPlayer456",
      avatar: "/placeholder.svg?height=40&width=40",
      mutualFriends: 3,
    },
    {
      name: "CoolGamer",
      avatar: "/placeholder.svg?height=40&width=40",
      mutualFriends: 1,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Bạn bè</h1>
            <p className="text-muted-foreground">
              Quản lý danh sách bạn bè của bạn
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">
                Tất cả bạn bè
                <Badge variant="secondary" className="ml-2">
                  {friends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="requests">
                Lời mời
                <Badge variant="secondary" className="ml-2">
                  {friendRequests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="search">
                <UserPlus className="mr-2 h-4 w-4" />
                Thêm bạn
              </TabsTrigger>
            </TabsList>

            {/* All Friends */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách bạn bè</CardTitle>
                  <CardDescription>
                    {friends.filter((f) => f.status === "online").length} người
                    đang online
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div
                        key={friend.name}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage
                                src={friend.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                            </Avatar>
                            {friend.status === "online" && (
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{friend.name}</div>
                            {friend.game ? (
                              <div className="text-sm text-muted-foreground">
                                {friend.game}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Offline
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Nhắn tin
                          </Button>
                          <Button variant="outline" size="sm">
                            Mời chơi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Friend Requests */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Lời mời kết bạn</CardTitle>
                  <CardDescription>
                    Chấp nhận hoặc từ chối lời mời
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div
                        key={request.name}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={request.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>{request.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{request.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.mutualFriends} bạn chung
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">
                            <Check className="mr-2 h-4 w-4" />
                            Chấp nhận
                          </Button>
                          <Button variant="outline" size="sm">
                            <X className="mr-2 h-4 w-4" />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Friend */}
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Tìm kiếm bạn bè</CardTitle>
                  <CardDescription>
                    Nhập tên người dùng để tìm kiếm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm theo tên..."
                        className="pl-9"
                      />
                    </div>
                    <Button>Tìm kiếm</Button>
                  </div>
                  <p className="text-center text-muted-foreground py-8">
                    Nhập tên người dùng để bắt đầu tìm kiếm
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
