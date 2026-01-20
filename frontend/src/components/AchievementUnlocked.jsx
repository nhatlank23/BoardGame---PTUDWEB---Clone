import { useEffect, useState } from "react";
import { Trophy, Sparkles, X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

export function AchievementUnlocked({ achievements, onClose }) {
    const [current, setCurrent] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (!achievements || achievements.length === 0) return;

        // Auto advance to next achievement after 5 seconds
        const timer = setTimeout(() => {
            if (current < achievements.length - 1) {
                setCurrent(current + 1);
            } else {
                handleClose();
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [current, achievements]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose?.();
        }, 300);
    };

    if (!achievements || achievements.length === 0) return null;

    const achievement = achievements[current];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isExiting ? "opacity-0" : "opacity-100"
                    }`}
                onClick={handleClose}
            />

            {/* Achievement Card */}
            <Card
                className={`relative z-10 w-full max-w-md mx-4 overflow-hidden border-4 border-yellow-500 shadow-2xl pointer-events-auto transition-all duration-300 ${isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
                    }`}
            >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 animate-pulse" />

                {/* Sparkle Effects */}
                <div className="absolute top-4 left-4 text-yellow-400 text-2xl animate-bounce">✨</div>
                <div className="absolute top-4 right-4 text-yellow-400 text-2xl animate-bounce delay-100">✨</div>
                <div className="absolute bottom-4 left-8 text-amber-400 text-xl animate-bounce delay-200">⭐</div>
                <div className="absolute bottom-4 right-8 text-amber-400 text-xl animate-bounce delay-300">⭐</div>

                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-20 hover:bg-white/20"
                    onClick={handleClose}
                >
                    <X className="h-4 w-4" />
                </Button>

                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center gap-2 text-yellow-500">
                            <Trophy className="h-8 w-8" />
                            <h2 className="text-2xl font-bold">Achievement Unlocked!</h2>
                            <Sparkles className="h-8 w-8" />
                        </div>
                    </div>

                    {/* Achievement Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>

                            {/* Icon */}
                            <Avatar className="h-32 w-32 border-4 border-yellow-500 relative shadow-2xl">
                                <AvatarImage src={achievement.icon_url} className="object-contain p-4" />
                                <AvatarFallback className="text-5xl bg-gradient-to-br from-yellow-100 to-amber-100">
                                    🏆
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {/* Achievement Details */}
                    <div className="text-center space-y-3">
                        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600">
                            {achievement.name}
                        </h3>
                        <p className="text-lg text-muted-foreground">
                            {achievement.description}
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    {achievements.length > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {achievements.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 rounded-full transition-all ${index === current
                                            ? "w-8 bg-yellow-500"
                                            : "w-2 bg-yellow-500/30"
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Counter */}
                    {achievements.length > 1 && (
                        <p className="text-center mt-2 text-sm text-muted-foreground">
                            {current + 1} / {achievements.length}
                        </p>
                    )}
                </div>

                {/* Bottom shine effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
            </Card>
        </div>
    );
}
