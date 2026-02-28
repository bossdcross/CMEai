import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Award,
  LayoutDashboard,
  FileText,
  Target,
  BarChart3,
  ScanLine,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  CalendarDays,
  ClipboardCheck
} from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Certificates", href: "/certificates", icon: FileText },
    { name: "Self-Reported", href: "/self-reported", icon: BookOpen },
    { name: "Events", href: "/events", icon: CalendarDays },
    { name: "Requirements", href: "/requirements", icon: Target },
    { name: "Evaluations", href: "/evaluations", icon: ClipboardCheck },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-bold text-lg text-slate-900 hidden sm:block">
                  CME<span className="text-indigo-600">ai</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="user-menu-btn">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.picture} alt={user?.name} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[150px] truncate">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center cursor-pointer" data-testid="settings-menu-item">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                    data-testid="logout-menu-item"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
