import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";

interface Share {
  id: string;
  permission: string;
  sharedWithAll: boolean;
  file: { originalName: string };
  sharedWithUser?: { fullName: string };
  sharedWithDept?: { name: string };
  sharedWithPlant?: { name: string };
}

export default function Shares() {
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    const { data } = await api.get("/shares");
    setShares(data.data.items);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRevoke(id: string) {
    await api.delete(`/shares/${id}`);
    load();
  }

  function targetLabel(s: Share) {
    if (s.sharedWithAll) return "Everyone";
    if (s.sharedWithUser) return s.sharedWithUser.fullName;
    if (s.sharedWithDept) return s.sharedWithDept.name;
    if (s.sharedWithPlant) return s.sharedWithPlant.name;
    return "Unknown";
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Shares</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isLoading ? "Loading…" : `${shares.length} active shares`}
      </p>

      {isLoading && (
        <div className="border rounded-lg divide-y">
          {[1, 2].map((i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && shares.length === 0 && (
        <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
          No shares yet. Share a file from the Files page to get started.
        </div>
      )}

      {!isLoading && shares.length > 0 && (
        <div className="border rounded-lg divide-y">
          {shares.map((share) => (
            <div key={share.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{share.file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  Shared with {targetLabel(share)} · {share.permission.replace("_", " ")}
                </p>
              </div>
              <Button
                onClick={() => handleRevoke(share.id)}
                className="bg-transparent hover:bg-destructive/10 text-destructive border border-border text-xs"
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}