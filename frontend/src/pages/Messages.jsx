import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { friendService } from "@/services/friendService";
import { messageService } from "@/services/messageService";

const PAGE_SIZE = 50;

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const [isEndPage, setIsEndPage] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadFriends();
  }, [page]);

  // Auto-select friend if passed via navigation state
  useEffect(() => {
    if (location.state?.selectedFriend && friends.length > 0) {
      const friendFromState = location.state.selectedFriend;
      const friend = friends.find((f) => f.id === friendFromState.id);
      if (friend) {
        setSelectedFriend(friend);
      }
    }
  }, [location.state, friends]);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // const loadMoreFriend = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await friendService.getFriends();
  //     if (response?.data) {
  //       // setFriends((prev) => [...prev, ...response.data]);
  //     }
  //   } catch (err) {
  //     console.error("Error loading friends:", err);
  //     setError("Không thể tải danh sách bạn bè");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      setError(null);
      const response = await friendService.getFriends(page, PAGE_SIZE);
      if (response?.data) {
        const newData = response.data;
        if (newData && newData.length <= 0) setIsEndPage(true);
        setFriends([...friends, ...newData]);
      }
    } catch (err) {
      console.error("Error loading friends:", err);
      setError("Không thể tải danh sách bạn bè");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const loadMessages = async (receiverId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageService.getMessages(receiverId);
      if (response?.data) {
        setMessages(response.data);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedFriend) return;

    try {
      setError(null);
      const response = await messageService.sendMessage(selectedFriend.id, messageInput.trim());
      if (response?.success && response?.data) {
        setMessages([...messages, response.data]);
        setMessageInput("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Không thể gửi tin nhắn");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const filteredFriends = friends.filter(
    (friend) => friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) || friend.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 ml-64 mt-16 pl-8 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-8 pb-0">
            <h1 className="text-4xl font-bold">Tin nhắn</h1>
          </div>

          {error && <div className="flex-shrink-0 mx-8 mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

          <div className="flex-1 pb-8 overflow-hidden p-8">
            <Card className="h-full flex flex-col p-0">
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                  {/* Conversations List */}
                  <div className="w-[350px] border-r flex flex-col flex-shrink-0">
                    <div className="flex-shrink-0 px-4 py-3 border-b h-[73px] flex items-center">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Tìm kiếm..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0">
                      {loading && filteredFriends.length === 0 && <div className="p-4 text-center text-muted-foreground">Đang tải...</div>}
                      {!loading && filteredFriends.length === 0 && <div className="p-4 text-center text-muted-foreground">Không có bạn bè</div>}
                      {filteredFriends.map((friend) => (
                        <button
                          key={friend.id}
                          onClick={() => setSelectedFriend(friend)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 h-[73px] border-b hover:bg-accent transition-colors",
                            selectedFriend?.id === friend.id && "bg-accent",
                          )}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{friend.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                            </Avatar>
                            {friend.status === "Online" && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold">{friend.name}</div>
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{friend.email}</div>
                          </div>
                        </button>
                      ))}
                      {isLoadingFriends && <div className="p-4 text-center text-muted-foreground">Đang tải...</div>}

                      {!isEndPage ? (
                        <div className="flex justify-center items-center m-2">
                          <p
                            onClick={() => {
                              if (isEndPage) return;
                              setPage((prev) => prev + 1);
                            }}
                            className="text-center text-muted-foreground py-1 px-4 rounded-full bg-foreground/10 w-fit hover:bg-foreground/15 cursor-pointer"
                          >
                            Hiện thêm
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">Hết</div>
                      )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {selectedFriend ? (
                      <>
                        {/* Chat Header */}
                        <div className="flex-shrink-0 px-4 py-3 border-b flex items-center gap-3 h-[73px]">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={selectedFriend.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{selectedFriend.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                            </Avatar>
                            {selectedFriend.status === "Online" && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{selectedFriend.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedFriend.status === "Online" ? (
                                <span className="text-green-500 font-medium">● Online</span>
                              ) : (
                                selectedFriend.email
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                          {loading && messages.length === 0 && <div className="text-center text-muted-foreground">Đang tải tin nhắn...</div>}
                          {!loading && messages.length === 0 && (
                            <div className="text-center text-muted-foreground">Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</div>
                          )}
                          {messages.map((message) => {
                            const isMe = message.sender_id === user?.id;
                            return (
                              <div key={message.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[70%] rounded-lg px-4 py-2", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                  <div>{message.content}</div>
                                  <div className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    {formatTime(message.created_at)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="flex-shrink-0 p-4 border-t">
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input placeholder="Nhập tin nhắn..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
                            <Button type="submit" size="icon" disabled={!messageInput.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">Chọn một bạn bè để bắt đầu trò chuyện</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
  );
}
