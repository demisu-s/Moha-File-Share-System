import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  fileId: string;
  fileName: string;
  onClose: () => void;
  onShared: () => void;
}

type Target = "USER" | "DEPARTMENT" | "PLANT" | "EVERYONE";

const PERMISSIONS = ["VIEW", "EDIT", "DELETE", "SHARE", "FULL_CONTROL"];

export default function ShareDialog({ fileId, fileName, onClose, onShared }: Props) {
  const [target, setTarget] = useState<Target>("USER");
  const [targetId, setTargetId] = useState("");
  const [permission, setPermission] = useState("VIEW");
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [plants, setPlants] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (target === "USER" && users.length === 0) {
      api.get("/users").then(({ data }) =>
        setUsers(data.data.items.filter((u: any) => u.id !== currentUser?.id))
      );
    }
    if (target === "DEPARTMENT" && departments.length === 0) {
      api.get("/departments").then(({ data }) => setDepartments(data.data.items ?? data.data));
    }
    if (target === "PLANT" && plants.length === 0) {
      api.get("/plants").then(({ data }) => setPlants(data.data.items));
    }
  }, [target]);

  async function handleShare() {
    setError("");
    if (target !== "EVERYONE" && !targetId) {
      setError("Pick who to share with.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = { fileId, permission };
      if (target === "USER") body.sharedWithUserId = targetId;
      if (target === "DEPARTMENT") body.sharedWithDeptId = targetId;
      if (target === "PLANT") body.sharedWithPlantId = targetId;
      if (target === "EVERYONE") body.sharedWithAll = true;

      await api.post("/shares", body);
      onShared();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Couldn't share the file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const optionsFor: Record<string, { id: string; label: string }[]> = {
    USER: users.map((u) => ({ id: u.id, label: u.fullName })),
    DEPARTMENT: departments.map((d) => ({ id: d.id, label: d.name })),
    PLANT: plants.map((p) => ({ id: p.id, label: p.name })),
    EVERYONE: [],
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm space-y-5">
        <div>
          <h3 className="font-semibold text-foreground">Share file</h3>
          <p className="text-sm text-muted-foreground truncate">{fileName}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Share with</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["USER", "DEPARTMENT", "PLANT", "EVERYONE"] as Target[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTarget(t);
                  setTargetId("");
                }}
                className={`text-xs py-1.5 rounded-md border transition-colors ${
                  target === t
                    ? "bg-brand text-white border-brand"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {t === "USER" ? "Person" : t === "DEPARTMENT" ? "Dept" : t === "PLANT" ? "Plant" : "Everyone"}
              </button>
            ))}
          </div>
        </div>

        {target !== "EVERYONE" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {target === "USER" ? "Person" : target === "DEPARTMENT" ? "Department" : "Plant"}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-9 px-2.5 rounded-md border border-border bg-background text-sm"
            >
              <option value="">Select…</option>
              {optionsFor[target].map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Permission</label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="w-full h-9 px-2.5 rounded-md border border-border bg-background text-sm"
          >
            {PERMISSIONS.map((p) => (
              <option key={p} value={p}>
                {p.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button onClick={onClose} className="bg-transparent hover:bg-muted text-foreground border border-border">
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            {isSubmitting ? "Sharing…" : "Share"}
          </Button>
        </div>
      </div>
    </div>
  );
}