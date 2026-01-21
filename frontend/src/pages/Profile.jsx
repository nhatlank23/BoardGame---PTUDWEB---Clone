import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

const ProfilePage = () => {
  const { userId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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
  const [achievements, setAchievements] = useState([]);

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Check if viewing own profile or another user's profile
  const isOwnProfile = !userId || (currentUser && userId === currentUser.id);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      fetchStats();
      fetchHistory();
      fetchAchievements();
    }
  }, [userId, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getMe();
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log("Fetching user data...");

      let userData;
      if (userId) {
        // Fetch other user's profile
        const response = await profileService.getUserProfile(userId);
        userData = response.data;
      } else {
        // Fetch own profile
        const response = await authService.getMe();
        userData = response.data.user;
      }

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

      let data;
      if (userId) {
        data = await profileService.getUserStats(userId);
      } else {
        data = await profileService.getStats();
      }

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

      let data;
      if (userId) {
        data = await profileService.getUserHistory(userId, 20);
      } else {
        data = await profileService.getHistory(20);
      }

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

  const fetchAchievements = async () => {
    try {
      console.log("Fetching achievements...");
      const achievementService = (await import("@/services/achievementService")).default;
      const response = userId ? await achievementService.getUserAchievements(userId) : await achievementService.getUserAchievements();

      console.log("Achievements response:", response);
      setAchievements(response.data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      // Don't show error toast for achievements as it's not critical
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

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
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
    <div className="max-w-5xl mx-auto py-8 px-8">
      <Card className="p-6">
        {/* Header với avatar và thông tin cơ bản */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarPreview || user.avatar_url} />
              <AvatarFallback className="text-4xl">{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isEditing && isOwnProfile && (
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
            {isEditing && isOwnProfile ? (
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
                {isOwnProfile && (
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">🏆 Thành tựu</span>
            {achievements.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {achievements.length}
              </Badge>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : achievements.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-yellow-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <Avatar className="h-16 w-16 border-2 border-yellow-500/30 relative">
                          <AvatarImage src={achievement.icon_url} className="object-contain p-2" />
                          <AvatarFallback className="text-2xl">🏅</AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-yellow-600 transition-colors truncate">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{achievement.description}</p>
                        {achievement.earned_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span>Đạt được: {formatTime(achievement.earned_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">✨</div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed">
              <div className="text-6xl mb-4 opacity-20">🏆</div>
              <p className="text-lg text-muted-foreground mb-2">Chưa có thành tựu</p>
              <p className="text-sm text-muted-foreground">Hãy chơi game và hoàn thành thử thách để mở khóa thành tựu!</p>
            </Card>
          )}
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
                    // Danh sách game tính điểm (không dùng thắng/thua/hòa)
                    const scoreBasedGames = ["Drawing", "Memory", "Match 3 Candy", "Classic Snake"];
                    const isScoreBased = scoreBasedGames.some((name) => match.game_name.toLowerCase().includes(name.toLowerCase()));

                    if (isScoreBased) {
                      // Game tính điểm: luôn hiển thị số điểm
                      scoreDisplay = <p className="text-lg font-bold">{match.score} điểm</p>;
                    } else {
                      // Game đối kháng: hiển thị thắng/thua/hòa
                      if (match.score === -1) {
                        scoreDisplay = <p className="text-lg font-bold text-red-500">Bại</p>;
                      } else if (match.score === 0) {
                        scoreDisplay = <p className="text-lg font-bold text-yellow-500">Hòa</p>;
                      } else if (match.score === 1) {
                        scoreDisplay = <p className="text-lg font-bold text-green-500">Thắng</p>;
                      } else {
                        // Trường hợp khác (không nên xảy ra với game đối kháng)
                        scoreDisplay = <p className="text-lg font-bold">{match.score} điểm</p>;
                      }
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
  );
};

export default ProfilePage;
