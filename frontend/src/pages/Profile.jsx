import React, { useState, useEffect } from "react";
import { Camera, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";

const ProfilePage = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({
    username: "",
    avatar_url: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Stats và history data
  const [stats, setStats] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchStats();
    fetchHistory();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log("Fetching user data...");
      const response = await authService.getMe();
      console.log("User data response:", response);
      const userData = response.data.user;
      setUser(userData);
      setEditData({
        username: userData.username,
        avatar_url: userData.avatar_url || "",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin người dùng",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      console.log("Fetching stats...");
      const data = await profileService.getStats();
      console.log("Stats response:", data);
      setStats(data.data || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thống kê",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      console.log("Fetching history...");
      const data = await profileService.getHistory(20);
      console.log("History response:", data);
      setHistory(data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lịch sử đấu",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Vui lòng chọn file ảnh",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 5MB",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (!editData.username || editData.username.trim().length < 3) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Username phải có ít nhất 3 ký tự",
        });
        return;
      }

      let avatarUrl = user.avatar_url;

      // Upload avatar if a new file is selected
      if (avatarFile) {
        try {
          const uploadResult = await profileService.uploadAvatar(avatarFile);
          avatarUrl = uploadResult.avatar_url;

          toast({
            title: "Thành công",
            description: "Upload avatar thành công",
          });
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            variant: "destructive",
            title: "Lỗi upload",
            description: uploadError.message || "Không thể upload avatar",
          });
          return;
        }
      }

      // Update username if changed
      if (editData.username !== user.username) {
        const updateData = {
          username: editData.username.trim(),
        };

        const updatedUser = await profileService.updateProfile(updateData);
        setUser({ ...updatedUser.data, avatar_url: avatarUrl });
      } else {
        // Only avatar was updated, refresh user data
        setUser({ ...user, avatar_url: avatarUrl });
      }

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      toast({
        title: "Thành công",
        description: "Cập nhật profile thành công",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật profile",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      username: user.username,
      avatar_url: user.avatar_url || "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Không tìm thấy thông tin người dùng</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            {/* Header với avatar và thông tin cơ bản */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarPreview || user.avatar_url} />
                  <AvatarFallback className="text-4xl">{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4" />
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Username</label>
                      <Input
                        value={editData.username}
                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                        placeholder="Nhập username mới"
                        className="max-w-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Lưu
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                      <h1 className="text-3xl font-bold">{user.username}</h1>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{user.email}</p>
                    <Button onClick={() => setIsEditing(true)} size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Tabs cho Thống kê và Lịch sử */}
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats" onClick={fetchStats}>
                  Thống kê
                </TabsTrigger>
                <TabsTrigger value="history" onClick={fetchHistory}>
                  Lịch sử
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4">
                {loadingStats ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : stats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Chưa có dữ liệu thống kê</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {stats.map((stat, index) => {
                      // Kiểm tra xem đây có phải game đối kháng không (record = 1 và có win_rate)
                      const isPvPGame = stat.record === 1 || stat.record === "1";

                      return (
                        <Card key={index} className="p-4">
                          <h3 className="font-semibold mb-3">{stat.game_name}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Đã chơi:</span>
                              <span className="font-medium">{stat.played} lần</span>
                            </div>
                            {isPvPGame ? (
                              // Game đối kháng: hiển thị tỷ lệ thắng
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tỷ lệ thắng:</span>
                                <span className="font-medium">{stat.win_rate || 0}%</span>
                              </div>
                            ) : (
                              // Game tính điểm: hiển thị kỷ lục và trung bình
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Kỷ lục:</span>
                                  <span className="font-medium">{stat.record} điểm</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Trung bình:</span>
                                  <span className="font-medium">{stat.avg_score} điểm</span>
                                </div>
                              </>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {loadingHistory ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Chưa có lịch sử đấu</div>
                ) : (
                  <div className="space-y-2">
                    {history.map((match) => {
                      // Xác định cách hiển thị score
                      let scoreDisplay = null;
                      if (match.score !== null && match.score !== undefined) {
                        if (match.score === -1) {
                          scoreDisplay = <p className="text-lg font-bold text-red-500">Bại</p>;
                        } else if (match.score === 0) {
                          scoreDisplay = <p className="text-lg font-bold text-yellow-500">Hòa</p>;
                        } else if (match.score === 1) {
                          scoreDisplay = <p className="text-lg font-bold text-green-500">Thắng</p>;
                        } else {
                          // Game tính điểm (score > 1 hoặc < -1)
                          scoreDisplay = <p className="text-lg font-bold">{match.score} điểm</p>;
                        }
                      }

                      return (
                        <Card key={match.id} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{match.game_name}</h3>
                              <p className="text-sm text-muted-foreground">{new Date(match.played_at).toLocaleString("vi-VN")}</p>
                            </div>
                            <div className="text-right">
                              {scoreDisplay}
                              {match.duration && (
                                <p className="text-sm text-muted-foreground">
                                  {Math.floor(match.duration / 60)}:{String(match.duration % 60).padStart(2, "0")}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
