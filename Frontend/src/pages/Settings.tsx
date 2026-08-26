import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Loader2, Settings as SettingsIcon, Info } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

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

  const updateSetting = async (key: string, value: any) => {
    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      await api.put(`/settings/${key}`, { value });
      toast.success("Setting updated successfully");
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update setting");
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  function formatKey(key: string) {
    return key
      .split(/[_.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function getSettingDescription(key: string) {
    const descriptions: Record<string, string> = {
      'system.maintenance_mode': 'Restricts access to the system for maintenance',
      'storage.max_file_size_mb': 'Maximum allowed file size for uploads in Megabytes',
      'storage.allowed_extensions': 'Comma-separated list of allowed file extensions',
      'auth.session_timeout_minutes': 'Idle time before a user is automatically logged out',
      'ui.default_theme': 'Default visual theme for new users (light, dark, system)',
    };
    return descriptions[key] || 'System configuration value';
  }

  function renderInput(s: any) {
    const isBoolean = typeof s.value === 'boolean';
    const isNumber = typeof s.value === 'number';

    if (isBoolean) {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={s.value}
            onChange={(e) => updateSetting(s.key, e.target.checked)}
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      );
    }

    if (isNumber) {
      return (
        <Input
          type="number"
          defaultValue={s.value}
          className="w-full sm:max-w-[200px] bg-background"
          onBlur={(e) => {
            const numVal = Number(e.target.value);
            if (numVal !== s.value && !isNaN(numVal)) updateSetting(s.key, numVal);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const numVal = Number(e.currentTarget.value);
              if (numVal !== s.value && !isNaN(numVal)) {
                updateSetting(s.key, numVal);
                e.currentTarget.blur();
              }
            }
          }}
        />
      );
    }

    return (
      <Input
        defaultValue={s.value}
        className="flex-1 bg-background"
        onBlur={(e) => {
          if (e.target.value !== s.value) updateSetting(s.key, e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value !== s.value) {
            updateSetting(s.key, e.currentTarget.value);
            e.currentTarget.blur();
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage application configurations and preferences</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {settings.length === 0 ? (
          <div className="border-2 border-dashed border-border/60 rounded-3xl p-16 text-center bg-card/30 flex flex-col items-center justify-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Settings Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">There are currently no custom settings configured for this system.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <div className="grid divide-y divide-border/60">
              {settings.map((s) => (
                <div key={s.key} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <label className="text-base font-semibold text-foreground block mb-1">
                      {formatKey(s.key)}
                    </label>
                    <p className="text-sm text-muted-foreground mb-2">
                      {getSettingDescription(s.key)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono bg-muted/60 inline-block px-2 py-0.5 rounded-md border border-border/50">
                      {s.key}
                    </p>
                  </div>
                  <div className="md:flex-1 flex items-center gap-3 justify-end md:justify-start">
                    {renderInput(s)}
                    <div className="w-6 flex justify-center flex-shrink-0">
                      {savingKeys[s.key] ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <div className="w-4 h-4" /> 
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
