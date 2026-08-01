import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  code: string;
  plantId: string;
  _count?: { users: number };
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/departments")
      .then(({ data }) => setDepartments(data.data.items ?? data.data))
      .catch(() => setError("Couldn't load departments."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Departments</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isLoading ? "Loading…" : `${departments.length} departments`}
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && departments.length > 0 && (
        <div className="border rounded-lg divide-y">
          {departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">{dept.name}</span>
              <span className="text-xs text-muted-foreground">{dept.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}