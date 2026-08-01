import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", roles: null },
  { path: "/files", label: "Files", roles: null },
  { path: "/users", label: "Users", roles: ["SUPER_ADMIN", "PLANT_ADMIN", "DEPARTMENT_HEAD"] },
  { path: "/plants", label: "Plants", roles: ["SUPER_ADMIN"] },
  { path: "/departments", label: "Departments", roles: ["SUPER_ADMIN", "PLANT_ADMIN"] },
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

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? "")
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-[#1C1F26] text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <span className="text-lg font-semibold tracking-tight">MOHA</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-[#D98E3F] text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </p>
            </div>
            <Button onClick={logout} className="h-8 bg-transparent hover:bg-muted text-foreground border text-xs">
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}