import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/ui/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import Login from "@/pages/Login";
import UsersList from "@/pages/UsersList";
import Files from "@/pages/Files";
import Plants from "@/pages/Plants";
import Departments from "@/pages/Departments";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface Stats {
  totalUsers: number;
  totalFiles: number;
  totalPlants: number | null;
  totalDepartments: number | null;
  recentFiles: {
    id: string;
    originalName: string;
    fileSize: number;
    createdAt: string;
    uploadedBy: { fullName: string };
  }[];
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then(({ data }) => setStats(data.data))
      .finally(() => setIsLoading(false));
  }, []);

  const cards = [
    { label: "Users", value: stats?.totalUsers },
    { label: "Files", value: stats?.totalFiles },
    ...(stats?.totalPlants !== null ? [{ label: "Plants", value: stats?.totalPlants }] : []),
    ...(stats?.totalDepartments !== null ? [{ label: "Departments", value: stats?.totalDepartments }] : []),
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome back, {user?.fullName}
      </h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">
        Here's what's happening across your scope.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-md">
              <p className="text-3xl font-bold text-[var(--brand)]">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.recentFiles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recently uploaded</h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-black/5">
            {stats.recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--color-background)]"
              >
                <span className="text-sm">{file.originalName}</span>
                <span className="text-xs text-muted-foreground">{file.uploadedBy.fullName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "SUPER_ADMIN",
                    "PLANT_ADMIN",
                    "DEPARTMENT_HEAD",
                  ]}
                >
                  <UsersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/plants"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <Plants />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPER_ADMIN", "PLANT_ADMIN"]}
                >
                  <Departments />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;