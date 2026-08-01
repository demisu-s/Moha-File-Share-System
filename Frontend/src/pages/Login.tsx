import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.png";

export default function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(employeeId, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid employee ID or password.");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#1C1F26] text-white p-12 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-2xl font-semibold tracking-tight">MOHA</span>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-light leading-tight max-w-md">
            One place for every file, across every plant.
          </h1>
          <p className="text-white/50 text-sm max-w-sm">
            Secure, role-based access for Main Factory and Branch Office teams.
          </p>
        </div>
        <img
          src={hero}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your employee ID to access your files.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="employeeId" className="text-sm font-medium">
                Employee ID
              </label>
              <input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP001"
                autoFocus
                className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-[#D98E3F]/40 focus-visible:border-[#D98E3F]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 rounded-md border bg-transparent text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-[#D98E3F]/40 focus-visible:border-[#D98E3F]"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D98E3F] hover:bg-[#D98E3F]/90 text-white"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}