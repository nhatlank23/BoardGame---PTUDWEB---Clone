import { ArrowLeft, ArrowRight, CornerDownRight, Lightbulb, Undo2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GameController({ onLeft, onRight, onEnter, onBack, onHint, disableLeft, disableRight, className }) {
  // Simulate key press ONLY if no specific handler is passed
  const simulateKeyPress = (key) => {
    const event = new KeyboardEvent("keydown", {
      key: key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const handleLeft = () => (!disableLeft ? (onLeft ? onLeft() : simulateKeyPress("ArrowLeft")) : null);
  const handleRight = () => (!disableRight ? (onRight ? onRight() : simulateKeyPress("ArrowRight")) : null);
  const handleEnter = () => (onEnter ? onEnter() : simulateKeyPress("Enter"));
  const handleBack = () => (onBack ? onBack() : simulateKeyPress("Escape"));
  const handleHint = () => (onHint ? onHint() : simulateKeyPress("h"));

  return (
    <Card className={cn("relative overflow-hidden bg-card/80 border-border p-6 shadow-2xl backdrop-blur-xl ring-1 ring-border/50", className)}>
      {/* Background Decorative Elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6 relative z-10">
        {/* Header Label */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <Gamepad2 size={14} className="text-primary" /> Controller
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>

        {/* TOP ROW: Small Function Buttons */}
        <div className="flex justify-between px-2">
          <ControlButton
            icon={<Undo2 size={18} />}
            label="Back"
            subLabel="ESC"
            colorClass="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border-rose-500/20"
            onClick={handleBack}
          />
          <ControlButton
            icon={<Lightbulb size={18} />}
            label="Hint"
            subLabel="H"
            colorClass="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 border-amber-500/20"
            onClick={handleHint}
          />
        </div>

        {/* MAIN CONTROLS ROW */}
        <div className="flex items-end justify-between gap-4 mt-2">
          {/* D-PAD Area (Visualized nicely) */}
          <div className="bg-secondary/50 p-3 rounded-2xl border border-border shadow-inner flex gap-2">
            <NavButton icon={<ArrowLeft size={28} />} onClick={handleLeft} disabled={disableLeft} />
            <NavButton icon={<ArrowRight size={28} />} onClick={handleRight} disabled={disableRight} />
          </div>

          {/* ACTION BUTTON (Big Enter) */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500" />
            <Button
              className="relative h-24 w-24 rounded-full bg-primary hover:bg-primary/90 border-4 border-border active:scale-95 transition-all shadow-xl flex flex-col items-center justify-center gap-1 group-active:shadow-none"
              onClick={handleEnter}
            >
              <CornerDownRight size={36} className="text-primary-foreground drop-shadow-md" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/90 text-shadow-sm">Enter</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Sub-component for small buttons (Back, Hint)
function ControlButton({ icon, label, subLabel, onClick, colorClass }) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "flex flex-col h-auto p-3 gap-2 transition-all duration-300 rounded-xl border bg-secondary/40 backdrop-blur-sm group hover:-translate-y-1",
        colorClass
      )}
      onClick={onClick}
    >
      <div className="p-1.5 rounded-md bg-secondary shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
      <div className="flex flex-col items-center leading-none gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</span>
        <span className="text-[8px] font-mono opacity-60">[{subLabel}]</span>
      </div>
    </Button>
  );
}

// Sub-component for Navigation Buttons (Arrows)
function NavButton({ icon, onClick, disabled }) {
  return (
    <Button
      className={cn(
        "h-16 w-16 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border-b-4 border-border active:border-b-0 active:translate-y-1 transition-all shadow-lg",
        disabled && "opacity-50 cursor-not-allowed active:border-b-4 active:translate-y-0"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </Button>
  );
}
