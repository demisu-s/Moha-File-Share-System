import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import logo from "@/assets/logo.png";
import loginBg from "@/assets/bg-login.jpg";

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
      <div className="hidden lg:block lg:col-span-2 relative overflow-hidden">
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand/40" />
        <div className="relative z-10 h-full p-12 flex items-start">
          <img src={logo} alt="MOHA" className="h-10 brightness-0 invert" />
        </div>
      </div>

      <div className="lg:col-span-3 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={logo} alt="MOHA" className="h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your employee ID to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="employeeId" className="text-sm font-medium text-foreground">
                Employee ID
              </label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP001"
                autoFocus
                className="bg-muted/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/30"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive animate-in fade-in duration-200" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium rounded-lg text-base"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}