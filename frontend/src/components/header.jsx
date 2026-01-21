import { Link } from "react-router-dom";
import { Moon, Sun, Search, Gamepad2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <Link to="/home" className="flex items-center gap-2">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Board Game</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button type="button" className="relative h-10 w-10 rounded-full inline-flex items-center justify-center bg-transparent">
                  <Avatar>
                    <AvatarImage src={user?.avatar_url || "/placeholder.svg?height=40&width=40"} />
                    <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    {user?.role === "admin" && (
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                {/* Show Profile only for non-admin users */}
                {user?.role !== "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={async (e) => {
                    try {
                      await logout();
                    } catch (err) {
                      console.error("Logout failed:", err);
                    } finally {
                      navigate("/auth");
                    }
                  }}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")}>Đăng nhập</Button>
          )}
        </div>
      </div>
    </header>
  );
}
