import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FolderOpen, Users, Building2, Network, Share2, Sun, Moon, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", roles: null, icon: LayoutDashboard },
  { path: "/files", label: "Files", roles: null, icon: FolderOpen },
  { path: "/shares", label: "Shares", roles: null, icon: Share2 },
  { path: "/users", label: "Users", roles: ["SUPER_ADMIN", "PLANT_ADMIN", "DEPARTMENT_HEAD"], icon: Users },
  { path: "/plants", label: "Plants", roles: ["SUPER_ADMIN"], icon: Building2 },
  { path: "/departments", label: "Departments", roles: ["SUPER_ADMIN", "PLANT_ADMIN"], icon: Network },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PLANT_ADMIN: "Plant Admin",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
  VIEWER: "Viewer",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? "")
  );

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
        <img src={logo} alt="MOHA" className="h-8" />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-muted-foreground"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "text-muted-foreground hover:bg-brand/10 hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — always visible at lg+ */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — off-canvas drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 flex flex-col bg-card border-r border-border">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={toggle}
              className="h-8 w-8 p-0 bg-transparent hover:bg-brand/10 text-foreground border border-border"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {user?.fullName}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </p>
            </div>
            <Button
              onClick={logout}
              className="h-8 bg-transparent hover:bg-muted text-foreground border border-border text-xs px-2 sm:px-3"
            >
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}