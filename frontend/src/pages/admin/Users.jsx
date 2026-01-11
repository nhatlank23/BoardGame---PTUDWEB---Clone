import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Lock, Unlock, Trash2 } from "lucide-react";

export default function Users() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionDialog, setActionDialog] = useState({
    open: false,
    action: "",
    user: "",
  });

  const users = [
    {
      id: 1,
      name: "ProGamer123",
      email: "progamer@example.com",
      status: "online",
      games: 145,
      joinDate: "2024-01-15",
      banned: false,
    },
    {
      id: 2,
      name: "MasterPlayer",
      email: "master@example.com",
      status: "online",
      games: 138,
      joinDate: "2024-01-20",
      banned: false,
    },
    {
      id: 3,
      name: "GameLegend",
      email: "legend@example.com",
      status: "offline",
      games: 132,
      joinDate: "2024-02-01",
      banned: false,
    },
    {
      id: 4,
      name: "BannedUser",
      email: "banned@example.com",
      status: "banned",
      games: 45,
      joinDate: "2024-03-10",
      banned: true,
    },
  ];

  const handleAction = (action, userName) => {
    setActionDialog({ open: true, action, user: userName });
  };

  const confirmAction = () => {
    // Handle action here
    setActionDialog({ open: false, action: "", user: "" });
  };

  const filteredUsers = users.filter((user) => {
    if (filterStatus === "all") return true;
    return user.status === filterStatus;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar isAdmin />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Quản lý Người dùng</h1>
            <p className="text-muted-foreground">
              Quản lý tài khoản và trạng thái người dùng
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div>
                  <CardTitle>Danh sách người dùng</CardTitle>
                  <CardDescription>
                    Tổng {users.length} người dùng
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm..." className="pl-9" />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="banned">Bị khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số game</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.status === "online" && (
                          <Badge variant="default" className="bg-green-500">
                            Online
                          </Badge>
                        )}
                        {user.status === "offline" && (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                        {user.status === "banned" && (
                          <Badge variant="destructive">Bị khóa</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.games}</TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.banned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("unlock", user.name)}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Mở khóa
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("lock", user.name)}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Khóa
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("delete", user.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "lock" && "Khóa tài khoản"}
              {actionDialog.action === "unlock" && "Mở khóa tài khoản"}
              {actionDialog.action === "delete" && "Xóa tài khoản"}
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn{" "}
              {actionDialog.action === "lock"
                ? "khóa"
                : actionDialog.action === "unlock"
                ? "mở khóa"
                : "xóa"}{" "}
              tài khoản <strong>{actionDialog.user}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, action: "", user: "" })
              }
            >
              Hủy
            </Button>
            <Button
              variant={
                actionDialog.action === "delete" ? "destructive" : "default"
              }
              onClick={confirmAction}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
