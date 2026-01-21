import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Play, Settings } from "lucide-react";

export default function GameSettingsPage() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState("5");

  const handleStartGame = () => {
    navigate(`/game/${gameId}/play`);
  };

  return (
    <div className="min-h-screen">
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Play Options */}
            <Card>
              <CardHeader>
                <CardTitle>Chế độ chơi</CardTitle>
                <CardDescription>Chọn đối thủ của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full h-20 text-lg"
                  size="lg"
                  onClick={handleStartGame}
                >
                  <Play className="mr-2 h-6 w-6" />
                  Chơi với máy
                </Button>
                <Button
                  className="w-full h-20 text-lg bg-transparent"
                  variant="outline"
                  size="lg"
                  disabled
                >
                  <Play className="mr-2 h-6 w-6" />
                  Chơi với bạn bè
                  <span className="ml-2 text-xs">(Sắp có)</span>
                </Button>
              </CardContent>
            </Card>

            {/* Game Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cài đặt game
                </CardTitle>
                <CardDescription>Tùy chỉnh trò chơi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Độ khó</Label>
                  <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label
                        htmlFor="easy"
                        className="font-normal cursor-pointer"
                      >
                        Dễ
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label
                        htmlFor="medium"
                        className="font-normal cursor-pointer"
                      >
                        Trung bình
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label
                        htmlFor="hard"
                        className="font-normal cursor-pointer"
                      >
                        Khó
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time">Thời gian ván đấu</Label>
                  <Select value={timeLimit} onValueChange={setTimeLimit}>
                    <SelectTrigger id="time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 phút</SelectItem>
                      <SelectItem value="5">5 phút</SelectItem>
                      <SelectItem value="10">10 phút</SelectItem>
                      <SelectItem value="15">15 phút</SelectItem>
                      <SelectItem value="unlimited">Không giới hạn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
