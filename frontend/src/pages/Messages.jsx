import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MessageCircle, Loader2, ArrowUp } from "lucide-react"; // Thêm icon ArrowUp
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { friendService } from "@/services/friendService";
import { messageService } from "@/services/messageService";

const PAGE_SIZE = 3;

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();

  // State
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false); // Trạng thái tải tin cũ
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination & Infinite Scroll logic variables
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [isEndPage, setIsEndPage] = useState(false);
  const [page, setPage] = useState(1);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false); // Dùng để đánh dấu hành động tải tin cũ

  // 1. Load Friends
  useEffect(() => {
    loadFriends();
  }, [page]);

  // 2. Auto-select friend from navigation
  useEffect(() => {
    if (location.state?.selectedFriend && friends.length > 0) {
      const friendFromState = location.state.selectedFriend;
      const friend = friends.find((f) => f.id === friendFromState.id);
      if (friend) setSelectedFriend(friend);
    }
  }, [location.state, friends]);

  // 3. Reset when changing friend
  useEffect(() => {
    if (selectedFriend) {
      setMessages([]);
      setHasMoreMessages(true);
      setNextCursor(null);
      loadMessages(selectedFriend.id);
    }
  }, [selectedFriend]);

  // Helper: Scroll to bottom (cho tin nhắn mới hoặc lần đầu load)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const response = await friendService.getFriends(page, PAGE_SIZE);
      if (response?.data) {
        const newData = response.data;
        if (newData.length <= 0) setIsEndPage(true);

        // --- SỬA ĐOẠN NÀY ---
        setFriends((prev) => {
          const combined = [...prev, ...newData];
          // Lọc trùng lặp bạn bè dựa trên ID
          const uniqueFriends = Array.from(
            new Map(combined.map((f) => [f.id, f])).values()
          );
          return uniqueFriends;
        });
        // --------------------
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách bạn bè");
    } finally {
      setIsLoadingFriends(false);
    }
  };
  const loadMessages = async (receiverId) => {
    try {
      setLoading(true);
      const response = await messageService.getMessages(receiverId);
      if (response?.data) {
        setMessages(response.data);
        setHasMoreMessages(response.pagination?.hasMore ?? false);
        setNextCursor(response.pagination?.nextCursor ?? null);

        // Scroll xuống dưới cùng sau khi load xong
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  // 4. Logic giữ vị trí cuộn khi tải tin cũ (QUAN TRỌNG)
  // Mặc dù dùng nút bấm, ta vẫn cần cái này để nội dung không bị nhảy loạn xạ
  useLayoutEffect(() => {
    if (isPrependingRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;

      // Nhảy ngay lập tức đến vị trí cũ (tạo cảm giác đứng yên)
      if (diff > 0) {
        container.scrollTop = diff; // Đặt vị trí scroll bằng đúng khoảng chênh lệch
      }
      isPrependingRef.current = false;
    }
  }, [messages]);

  // 5. Hàm tải tin nhắn cũ (Trigger bằng nút bấm)
  const loadOlderMessages = async () => {
    if (!selectedFriend || !hasMoreMessages || loadingOlder || !nextCursor) return;

    try {
      setLoadingOlder(true);
      const container = messagesContainerRef.current;

      // 1. Lưu vị trí cuộn hiện tại
      prevScrollHeightRef.current = container?.scrollHeight || 0;
      isPrependingRef.current = true;

      const response = await messageService.getMessages(selectedFriend.id, nextCursor);

      if (response?.data && response.data.length > 0) {
        console.log("Đã tải được:", response, "tin nhắn cũ"); // Check log này

        setMessages((prev) => {
          // 2. Gộp mảng: Tin cũ (response.data) + Tin hiện tại (prev)
          const combined = [...response.data, ...prev];

          // 3. Lọc trùng lặp (Dùng Map là chuẩn nhất)
          const uniqueMap = new Map();
          combined.forEach(msg => uniqueMap.set(msg.id, msg));

          return Array.from(uniqueMap.values());
        });

        const newHasMore = response.pagination?.hasMore === true;
        setHasMoreMessages(newHasMore);
        setNextCursor(newHasMore ? response.pagination?.nextCursor : null);
      } else {
        setHasMoreMessages(false);
        setNextCursor(null);
        isPrependingRef.current = false; // Reset nếu không có data
      }
    } catch (err) {
      console.error(err);
      setHasMoreMessages(false);
      isPrependingRef.current = false;
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedFriend) return;

    try {
      const response = await messageService.sendMessage(selectedFriend.id, messageInput.trim());
      if (response?.success && response?.data) {
        setMessages([...messages, response.data]);
        setMessageInput("");
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể gửi tin nhắn");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const filteredFriends = friends.filter(
    (friend) => friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden -m-4">
      <div className="flex-shrink-0 p-8 pb-0">
        <h1 className="text-4xl font-bold">Tin nhắn</h1>
      </div>

      {error && <div className="flex-shrink-0 mx-8 mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

      <div className="flex-1 p-8 pt-4 overflow-hidden">
        <Card className="h-full flex flex-col p-0 shadow-lg border-muted/20">
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-1 overflow-hidden">

              {/* SIDEBAR DANH SÁCH BẠN BÈ (GIỮ NGUYÊN) */}
              <div className="w-[350px] border-r flex flex-col flex-shrink-0 bg-muted/5">
                <div className="flex-shrink-0 px-4 py-3 border-b h-[73px] flex items-center">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {filteredFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 h-[73px] border-b hover:bg-accent transition-colors",
                        selectedFriend?.id === friend.id && "bg-accent"
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
                        <div className="font-semibold">{friend.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{friend.email}</div>
                      </div>
                    </button>
                  ))}
                  {!isEndPage ? (
                    <div className="flex justify-center p-2">
                      <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>Hiện thêm bạn bè</Button>
                    </div>
                  ) : (
                    <div className="p-2 text-center text-xs text-muted-foreground">Hết danh sách</div>
                  )}
                </div>
              </div>

              {/* KHU VỰC CHAT CHÍNH */}
              <div className="flex-1 flex flex-col min-w-0 bg-background">
                {selectedFriend ? (
                  <>
                    {/* Header Chat */}
                    <div className="flex-shrink-0 px-4 py-3 border-b flex items-center gap-3 h-[73px]">
                      <Avatar>
                        <AvatarImage src={selectedFriend.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{selectedFriend.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{selectedFriend.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedFriend.status === "Online" ? <span className="text-green-500 font-medium">● Online</span> : "Offline"}
                        </div>
                      </div>
                    </div>

                    {/* Vùng hiển thị tin nhắn */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-accent/5"
                    >

                      {/* === NÚT TẢI TIN NHẮN CŨ (THAY THẾ CUỘN VÔ TẬN) === */}
                      <div className="flex justify-center py-2">
                        {loadingOlder ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải tin cũ...
                          </div>
                        ) : hasMoreMessages && messages.length > 0 ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={loadOlderMessages}
                            className="rounded-full text-xs h-8 bg-muted/50 hover:bg-muted"
                          >
                            <ArrowUp className="w-3 h-3 mr-1" /> Tải tin nhắn cũ hơn
                          </Button>
                        ) : null}
                      </div>
                      {/* =================================================== */}

                      {loading && messages.length === 0 && <div className="text-center text-muted-foreground">Đang tải tin nhắn...</div>}

                      {!loading && messages.length === 0 && (
                        <div className="text-center text-muted-foreground pt-12">
                          Chưa có tin nhắn. Hãy bắt đầu trò chuyện!
                        </div>
                      )}

                      {messages.map((message) => {
                        const isMe = message.sender_id === user?.id;
                        return (
                          <div key={message.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                              )}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className={cn("text-[10px] mt-1 opacity-70 flex justify-end", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Chat */}
                    <div className="flex-shrink-0 p-4 border-t bg-background">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          placeholder="Nhập tin nhắn..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          className="rounded-full bg-muted/50 border-none focus-visible:ring-1"
                        />
                        <Button type="submit" size="icon" disabled={!messageInput.trim()} className="rounded-full flex-shrink-0 h-10 w-10">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-accent/5">
                    <MessageCircle className="h-16 w-16 opacity-10 mb-4" />
                    <p>Chọn một bạn bè để bắt đầu trò chuyện</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}