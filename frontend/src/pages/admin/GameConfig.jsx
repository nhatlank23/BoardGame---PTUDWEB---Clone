import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

export default function GameConfig() {
  const { gameId } = useParams();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar isAdmin />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/admin/games">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Game</CardTitle>
              <CardDescription>Chỉnh sửa thông số và cài đặt cho game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="game-name">Tên game</Label>
                <Input id="game-name" defaultValue="Caro" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" rows={3} defaultValue="Trò chơi cờ caro cổ điển với luật chơi 5 quân liên tiếp" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rows">Số hàng (Rows)</Label>
                  <Input id="rows" type="number" defaultValue="15" min="5" max="20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cols">Số cột (Columns)</Label>
                  <Input id="cols" type="number" defaultValue="15" min="5" max="20" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Thời gian ván đấu (phút)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[1, 5, 10, 15, 20, 30].map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <input type="checkbox" id={`time-${time}`} defaultChecked={[5, 10, 15].includes(time)} className="rounded" />
                      <Label htmlFor={`time-${time}`} className="font-normal cursor-pointer">
                        {time} phút
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Độ khó AI</Label>
                <div className="grid grid-cols-3 gap-3">
                  {["Dễ", "Trung bình", "Khó"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <input type="checkbox" id={`level-${level}`} defaultChecked className="rounded" />
                      <Label htmlFor={`level-${level}`} className="font-normal cursor-pointer">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {saved ? "Đã lưu!" : "Lưu thay đổi"}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/games">Hủy</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
