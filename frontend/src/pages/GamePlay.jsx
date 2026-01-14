import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, CornerDownRight, Save, Lightbulb } from "lucide-react";

export default function GameplayPage() {
  const { gameId } = useParams();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState("05:00");

  // Mock game board
  const board = Array(10)
    .fill(null)
    .map(() => Array(10).fill(0));

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" asChild>
              <Link to="/home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="flex gap-4">
              <Button onClick={() => setShowSaveDialog(true)}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-6">
            {/* Game Board */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square max-w-2xl mx-auto bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-10 gap-1 h-full">
                    {board.map((row, i) =>
                      row.map((cell, j) => (
                        <button key={`${i}-${j}`} className="bg-background border border-border hover:bg-accent rounded transition-colors" />
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Controls */}
            <div className="space-y-6 lg:w-80">
              {/* Stats */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Điểm số</div>
                    <div className="text-3xl font-bold">{score}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Thời gian</div>
                    <div className="text-2xl font-mono font-bold">{time}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Control Buttons */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-sm font-medium mb-4">Điều khiển</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div />
                    <Button variant="outline" size="lg" className="h-14 bg-transparent">
                      <ArrowUp className="h-6 w-6" />
                    </Button>
                    <div />
                    <Button variant="outline" size="lg" className="h-14 bg-transparent">
                      <span className="font-bold text-lg">L</span>
                    </Button>
                    <Button variant="outline" size="lg" className="h-14 bg-transparent">
                      <ArrowDown className="h-6 w-6" />
                    </Button>
                    <Button variant="outline" size="lg" className="h-14 bg-transparent">
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="default" size="lg" className="h-14">
                      <CornerDownRight className="mr-2 h-5 w-5" />
                      Enter
                    </Button>
                    <Button variant="secondary" size="lg" className="h-14">
                      <Lightbulb className="mr-2 h-5 w-5" />
                      Hint
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lưu game</DialogTitle>
            <DialogDescription>Bạn có muốn lưu tiến trình game hiện tại?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Hủy
            </Button>
            <Button onClick={() => setShowSaveDialog(false)}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
