import { use, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loading from "../../components/ui/loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Lock, Unlock, Trash2 } from "lucide-react";
import { adminService } from "../../services/adminService";
import { useToast } from "../../hooks/use-toast";

export default function Users() {
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actionDialog, setActionDialog] = useState({ open: false, action: "", username: "", userId: "" });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // const users = [
  //   {
  //     id: 1,
  //     name: "ProGamer123",
  //     email: "progamer@example.com",
  //     status: "online",
  //     games: 145,
  //     joinDate: "2024-01-15",
  //     banned: false,
  //   },
  //   {
  //     id: 2,
  //     name: "MasterPlayer",
  //     email: "master@example.com",
  //     status: "online",
  //     games: 138,
  //     joinDate: "2024-01-20",
  //     banned: false,
  //   },
  //   {
  //     id: 3,
  //     name: "GameLegend",
  //     email: "legend@example.com",
  //     status: "offline",
  //     games: 132,
  //     joinDate: "2024-02-01",
  //     banned: false,
  //   },
  //   {
  //     id: 4,
  //     name: "BannedUser",
  //     email: "banned@example.com",
  //     status: "banned",
  //     games: 45,
  //     joinDate: "2024-03-10",
  //     banned: true,
  //   },
  // ];

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();

      setUsers(res.data);
    } catch (error) {
      toast({ title: "Lỗi kết nối", description: "Vui lòng kiểm tra API", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleAction = (action, userName, userId) => {
    setActionDialog({ open: true, action, username: userName, userId: userId });
  };

  const handleFilterUser = (users) => {
    if (!users || users.length <= 0) return;

    setFilteredUsers(
      users.filter((user) => {
        if (filterStatus === "all") return true;

        console.log(filterStatus, user);

        switch (filterStatus) {
          case "banned":
            return user.is_banned == true;
          case "Online":
            return user.status === "Online";
          case "Offline":
            return user.status === "Offline";
        }
      }),
    );
  };

  const confirmAction = () => {
    if (actionDialog.open === false) return;

    async function bannedUser(id) {
      setLoading(true);
      const res = await adminService.toggleBanUser(id, true);

      await fetchUsers();

      setLoading(false);

      toast({
        title: "Thành công",
        description: "Khóa user thành công",
      });
    }

    async function unBannedUser(id) {
      const res = await adminService.toggleBanUser(id, false);

      await fetchUsers();

      toast({
        title: "Thành công",
        description: "Mở khóa user thành công",
      });
    }

    const userId = actionDialog.userId;
    if (actionDialog.action === "lock") {
      bannedUser(userId);
    } else if (actionDialog.action === "unlock") {
      unBannedUser(userId);
    }

    setActionDialog({ open: false, action: "", username: "", userId: "" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    handleFilterUser(users);
  }, [filterStatus, users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search) {
        handleFilterUser(users);
        return;
      }

      const handSearchUser = async () => {
        const res = await adminService.getSearchUser(search);

        setFilteredUsers(res.data);
      };

      handSearchUser();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Quản lý Người dùng</h1>
            <p className="text-muted-foreground">Quản lý tài khoản và trạng thái người dùng</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div>
                  <CardTitle>Danh sách người dùng</CardTitle>
                  <CardDescription>Tổng {users.length} người dùng</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="pl-9" />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                      <SelectItem value="banned">Bị khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loading className="w-full h-32"></Loading>
              ) : (
                <>
                  {filteredUsers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Người dùng</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Vai trò</TableHead>
                          <TableHead>Ngày tham gia</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.is_banned === true ? (
                                <Badge variant="destructive">Bị khóa</Badge>
                              ) : (
                                <>
                                  {user.status === "Online" ? (
                                    <Badge variant="default" className="bg-green-600">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Offline</Badge>
                                  )}
                                </>
                              )}
                            </TableCell>
                            <TableCell>{user.role === "admin" ? "Admin" : "Player"}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {user.is_banned ? (
                                  <Button variant="outline" size="sm" onClick={() => handleAction("unlock", user.name, user.id)}>
                                    <Unlock className="h-4 w-4 mr-1" />
                                    Mở khóa
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={() => handleAction("lock", user.name, user.id)}>
                                    <Lock className="h-4 w-4 mr-1" />
                                    Khóa
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="w-full text-center h-24 align-middle">
                      <p>Không có kết quả</p>
                    </div>
                  )}
                </>
              )}
              <div className="w-full flex flex-row justify-center items-center gap-5">
                <Button>Trang tiếp</Button>
                <Button>Trang trước</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "lock" && "Khóa tài khoản"}
              {actionDialog.action === "unlock" && "Mở khóa tài khoản"}
              {actionDialog.action === "delete" && "Xóa tài khoản"}
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn {actionDialog.action === "lock" ? "khóa" : actionDialog.action === "unlock" ? "mở khóa" : "xóa"} tài khoản{" "}
              <strong>{actionDialog.username}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: "", username: "", userId: "" })}>
              Hủy
            </Button>
            <Button variant={actionDialog.action === "delete" ? "destructive" : "default"} onClick={confirmAction}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
