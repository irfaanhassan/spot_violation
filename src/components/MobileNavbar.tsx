import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, AlertTriangle, Trophy, User, Menu, X, Wallet, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const MobileNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const menuItems = [
    {
      title: "Dashboard",
      path: "/app",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Report Violation",
      path: "/app/report",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Leaderboard",
      path: "/app/leaderboard",
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      title: "Subscription",
      path: "/app/subscription",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "My Wallet",
      path: "/app/wallet",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      title: "Profile",
      path: "/app/profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="fixed bottom-0 z-50 w-full border-t bg-background py-2 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          <Link to="/app" className={`flex flex-col items-center justify-center py-1 ${
            location.pathname === '/app' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/app/report" className={`flex flex-col items-center justify-center py-1 ${
            location.pathname === '/app/report' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs">Report</span>
          </Link>
          <Link to="/app/leaderboard" className={`flex flex-col items-center justify-center py-1 ${
            location.pathname === '/app/leaderboard' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <Trophy className="h-5 w-5" />
            <span className="text-xs">Leaderboard</span>
          </Link>
          <Link to="/app/wallet" className={`flex flex-col items-center justify-center py-1 ${
            location.pathname === '/app/wallet' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <Wallet className="h-5 w-5" />
            <span className="text-xs">Wallet</span>
          </Link>
          <button onClick={toggleMenu} className="flex flex-col items-center justify-center py-1 text-muted-foreground">
            <Menu className="h-5 w-5" />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex items-center justify-between border-b p-4">
            <div className="font-medium">Menu</div>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                    location.pathname === item.path ? 'bg-muted font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
              <hr className="my-2" />
              <button
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;
