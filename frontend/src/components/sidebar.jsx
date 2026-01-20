import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Users,
  MessageSquare,
  Trophy,
  BarChart3,
  UserCog,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ isAdmin = false }) {
  const location = useLocation();
  const pathname = location.pathname;

  const userNavItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/ranking", label: "Ranking", icon: Trophy },
  ];

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Admin Dashboard", icon: BarChart3 },
    { href: "/admin/users", label: "Quản lý người dùng", icon: UserCog },
    { href: "/admin/games", label: "Quản lý Game", icon: Gamepad2 },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
