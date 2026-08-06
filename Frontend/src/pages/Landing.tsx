import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import landingBg from "@/assets/bg-landing.jpg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <img
        src={landingBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-brand/30" />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 h-20">
        <img src={logo} alt="MOHA" className="h-9 brightness-0 invert" />
        <Button
          onClick={() => navigate("/login")}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
        >
          Sign in
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-end pb-20 px-6">
        <Button
          onClick={() => navigate("/login")}
          className="h-12 px-8 bg-white text-brand hover:bg-white/90 font-semibold rounded-lg shadow-xl"
        >
          Get started
        </Button>
      </main>
    </div>
  );
}