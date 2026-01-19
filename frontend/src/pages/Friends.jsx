import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Check, X, MessageCircle } from "lucide-react";
import { friendService } from "@/services/friendService";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

export default function FriendsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadSentRequests();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const resp = await profileService.getMe();
      console.log("Current user response:", resp);
      if (resp && resp.data) {
        const userId = resp.data.user?.id || resp.data.id;
        console.log("Setting currentUserId:", userId);
        setCurrentUserId(userId);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const response = await friendService.getFriends();
      if (response.data) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bạn bè",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await friendService.getFriendRequests();
      if (response.data) {
        setFriendRequests(response.data);
      }
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await friendService.getSentRequests();
      if (response.data) {
        setSentRequests(response.data);
      }
    } catch (error) {
      console.error("Error loading sent requests:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({
        title: "Thông báo",
        description: "Vui lòng nhập ít nhất 2 ký tự để tìm kiếm",
        variant: "default",
      });
      return;
    }

    try {
      setIsSearching(true);
      console.log("Searching with currentUserId:", currentUserId);
      const response = await friendService.searchUsers(searchQuery);
      console.log("Search response:", response);

      if (response.data) {
        const results = Array.isArray(response.data) ? response.data : response.data.data || [];
        console.log("Results before filter:", results);
        console.log("Current user ID for filtering:", currentUserId);

        // Double-check filter - exclude current user
        const filtered = results.filter((u) => u.id !== currentUserId);
        console.log("Results after filter:", filtered);

        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tìm kiếm người dùng",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    console.log("Sending friend request to user ID:", userId);
    try {
      await friendService.sendFriendRequest(userId);
      toast({
        title: "Thành công",
        description: "Đã gửi lời mời kết bạn",
      });
      // Reload sent requests to update UI
      loadSentRequests();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi lời mời kết bạn",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await friendService.respondToRequest(requesterId, "accept");
      toast({
        title: "Thành công",
        description: "Đã chấp nhận lời mời kết bạn",
      });
      // Reload all lists
      loadFriends();
      loadFriendRequests();
      loadSentRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Lỗi",
        description: "Không thể chấp nhận lời mời",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requesterId) => {
    try {
      await friendService.respondToRequest(requesterId, "decline");
      toast({
        title: "Thành công",
        description: "Đã từ chối lời mời kết bạn",
      });
      loadFriendRequests();
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối lời mời",
        variant: "destructive",
      });
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      await friendService.deleteFriend(friendId);
      toast({
        title: "Thành công",
        description: "Đã hủy kết bạn",
      });
      loadFriends();
    } catch (error) {
      console.error("Error unfriending:", error);
      toast({
        title: "Lỗi",
        description: "Không thể hủy kết bạn",
        variant: "destructive",
      });
    }
  };

  // Check if user is already a friend
  const isFriend = (userId) => {
    return friends.some((friend) => friend.id === userId);
  };

  // Check if user has sent you a friend request (incoming)
  const hasIncomingRequest = (userId) => {
    return friendRequests.some((request) => request.id === userId);
  };

  // Check if you have sent a friend request to this user (outgoing)
  const hasSentRequest = (userId) => {
    return sentRequests.some((request) => request.id === userId);
  };

  // Navigate to messages page with selected friend
  const handleMessageClick = (friend) => {
    navigate("/messages", {
      state: { selectedFriend: friend },
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Bạn bè</h1>
            <p className="text-muted-foreground">Quản lý danh sách bạn bè của bạn</p>
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
                  <CardDescription>{friends.length} người bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Đang tải...</p>
                  ) : friends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Bạn chưa có bạn bè nào</p>
                  ) : (
                    <div className="space-y-3">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{friend.name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{friend.name}</div>
                              <div className="text-sm text-muted-foreground">{friend.email}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleMessageClick(friend)}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Nhắn tin
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleUnfriend(friend.id)}>
                              <X className="mr-2 h-4 w-4" />
                              Hủy kết bạn
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Friend Requests */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Lời mời kết bạn</CardTitle>
                  <CardDescription>Chấp nhận hoặc từ chối lời mời</CardDescription>
                </CardHeader>
                <CardContent>
                  {friendRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Không có lời mời kết bạn nào</p>
                  ) : (
                    <div className="space-y-3">
                      {friendRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={request.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{request.name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{request.name}</div>
                              <div className="text-sm text-muted-foreground">{request.email}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Chấp nhận
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeclineRequest(request.id)}>
                              <X className="mr-2 h-4 w-4" />
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Friend */}
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Tìm kiếm bạn bè</CardTitle>
                  <CardDescription>Nhập tên người dùng để tìm kiếm</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm theo tên..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? "Đang tìm..." : "Tìm kiếm"}
                    </Button>
                  </div>

                  {searchResults.length === 0 && !isSearching ? (
                    <p className="text-center text-muted-foreground py-8">Nhập tên người dùng để bắt đầu tìm kiếm</p>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          {isFriend(user.id) ? (
                            <Badge variant="secondary" className="px-3 py-1">
                              Bạn bè
                            </Badge>
                          ) : hasIncomingRequest(user.id) ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAcceptRequest(user.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Đồng ý
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeclineRequest(user.id)}>
                                <X className="mr-2 h-4 w-4" />
                                Từ chối
                              </Button>
                            </div>
                          ) : hasSentRequest(user.id) ? (
                            <Badge variant="outline" className="px-3 py-1">
                              Đã gửi lời mời
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Thêm bạn
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
