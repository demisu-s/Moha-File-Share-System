import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

interface Plant {
  id: string;
  name: string;
  code: string;
  location: string;
  _count: { departments: number; users: number; files: number };
}

export default function Plants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/plants")
      .then(({ data }) => setPlants(data.data.items))
      .catch(() => setError("Couldn't load plants."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Plants</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isLoading ? "Loading…" : `${plants.length} plants`}
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-5 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && plants.length === 0 && !error && (
        <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
          No plants yet.
        </div>
      )}

      {!isLoading && plants.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="border rounded-lg p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{plant.name}</h3>
                <span className="text-xs text-muted-foreground">{plant.code}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{plant.location}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{plant._count.departments} departments</span>
                <span>{plant._count.users} people</span>
                <span>{plant._count.files} files</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}