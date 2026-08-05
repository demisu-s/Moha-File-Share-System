import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import loginBg from "@/assets/bg-login.jpg"; // Neon grid image

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
    <div className="min-h-screen grid lg:grid-cols-5 bg-background">
      {/* Left Panel with Blurred Synthwave Grid Background */}
      <div className="hidden lg:flex lg:col-span-2 flex-col justify-between text-white p-12 relative overflow-hidden bg-brand">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={loginBg}
            alt="Background"
            className="w-full h-full object-cover filter blur-md scale-110 brightness-75"
          />
          <div className="absolute inset-0 bg-brand/60 backdrop-blur-xs" />
        </div>

        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/5 z-0 pointer-events-none" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-white/5 z-0 pointer-events-none" />

        <img src={logo} alt="MOHA" className="h-10 relative z-10 brightness-0 invert" />

        <div className="relative z-10 space-y-5">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase bg-white/15 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
            Internal Platform
          </span>
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight drop-shadow-md">
            Every file.
            <br />
            Every plant.
            <br />
            One place.
          </h1>
          <p className="text-white/80 text-sm max-w-xs drop-shadow-sm">
            Secure, role-based file access across Main Factory and Branch Office.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-sm">
          <div>
            <p className="text-2xl font-bold">2</p>
            <p className="text-white/70">Plants</p>
          </div>
          <div>
            <p className="text-2xl font-bold">4</p>
            <p className="text-white/70">Departments</p>
          </div>
          <div>
            <p className="text-2xl font-bold">5</p>
            <p className="text-white/70">Access Levels</p>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="lg:col-span-3 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-sm space-y-8 relative z-10">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={logo} alt="MOHA" className="h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your employee ID to access your files.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="employeeId" className="text-sm font-medium text-foreground">
                Employee ID
              </label>
              <input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP001"
                autoFocus
                className="w-full h-11 px-3.5 rounded-lg border border-border bg-muted/30 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-light/40 focus-visible:border-brand-light"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-border bg-muted/30 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-light/40 focus-visible:border-brand-light"
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
              className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium rounded-lg"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            MOHA File Share System — internal use only
          </p>
        </div>
      </div>
    </div>
  );
}