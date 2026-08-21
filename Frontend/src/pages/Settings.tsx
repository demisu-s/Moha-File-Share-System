import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/settings");
      setSettings(data.data);
    } catch (error: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.put(`/settings/${key}`, { value });
      toast.success("Setting updated successfully");
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update setting");
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-foreground">System Settings</h1>
      <div className="space-y-4">
        {settings.length === 0 ? (
          <p className="text-muted-foreground">No custom settings configured yet.</p>
        ) : (
          settings.map((s) => (
            <div key={s.key} className="flex flex-col gap-2 bg-card p-4 rounded-xl border border-border">
              <label className="font-semibold text-foreground">{s.key}</label>
              <Input
                defaultValue={s.value}
                onBlur={(e) => {
                  if (e.target.value !== s.value) updateSetting(s.key, e.target.value);
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
