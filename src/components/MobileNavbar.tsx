
import { Link, useLocation } from "react-router-dom";
import { Home, AlertTriangle, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", path: "/app", icon: Home },
  { name: "Report", path: "/app/report", icon: AlertTriangle },
  { name: "Leaderboard", path: "/app/leaderboard", icon: Trophy },
  { name: "Profile", path: "/app/profile", icon: User },
];

const MobileNavbar = () => {
  const location = useLocation();

  return (
    <nav className="sticky bottom-0 w-full border-t bg-background safe-area z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavbar;
