import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FolderOpen, Users, Building2, Network } from "lucide-react";
import logo from "@/assets/logo.png";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", roles: null, icon: LayoutDashboard },
  { path: "/files", label: "Files", roles: null, icon: FolderOpen },
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
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? "")
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <img src={logo} alt="MOHA" className="h-8" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-foreground/70 hover:bg-brand/10"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {user?.fullName}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </p>
            </div>
             <Button
    onClick={toggle}
    className="h-8 w-8 p-0 bg-transparent hover:bg-brand/10 text-foreground border border-border"
  >
    {theme === "light" ? (
      <Moon className="size-4" />
    ) : (
      <Sun className="size-4" />
    )}
  </Button>

  <Button
    onClick={logout}
    className="h-8 bg-transparent hover:bg-brand/10 text-foreground border border-border text-xs"
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