import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

interface User {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  role: string;
  isActive: boolean;
  plantId: string | null;
  departmentId: string | null;
}

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-[var(--brand)]/15 text-[var(--brand)]",
  PLANT_ADMIN: "bg-blue-500/10 text-blue-600",
  DEPARTMENT_HEAD: "bg-purple-500/10 text-purple-600",
  EMPLOYEE: "bg-muted text-muted-foreground",
  VIEWER: "bg-muted text-muted-foreground",
};

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await api.get("/users");
        setUsers(data.data.items);
        setTotal(data.data.total);
      } catch {
        setError("Couldn't load users. Try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${total} ${total === 1 ? "person" : "people"} in your scope`}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {isLoading && (
        <div className="border rounded-lg divide-y">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-sm">No users found in your scope yet.</p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
  <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Employee ID</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t transition-colors hover:bg-[var(--color-background)]">
                  <td className="px-4 py-2">
                    {u.fullName}
                    {u.id === currentUser?.id && (
                      <span className="text-xs text-muted-foreground ml-1">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{u.employeeId}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[u.role] ?? ""}`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {u.isActive ? (
                      <span className="text-xs text-green-600">Active</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}