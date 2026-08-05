import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import landingBg from "@/assets/bg-landing.jpg"; // Pepsi Max ice splash image

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-brand">
      {/* Blurred Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={landingBg}
          alt="Background"
          className="w-full h-full object-cover filter blur-lg scale-110 brightness-50"
        />
        {/* Dark brand overlay for optimal text contrast */}
        <div className="absolute inset-0 bg-brand/50 backdrop-blur-xs" />
      </div>

      {/* Decorative ambient lighting elements */}
      <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-white/5 z-0 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-white/5 z-0 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-white/[0.03] z-0 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 h-20">
        <img src={logo} alt="MOHA" className="h-9 brightness-0 invert" />
        <Button
          onClick={() => navigate("/login")}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
        >
          Sign in
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase bg-white/15 text-white px-3 py-1 rounded-full mb-6 backdrop-blur-md border border-white/10">
          MOHA Soft Drinks Industry S.C.
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.1] max-w-3xl drop-shadow-md">
          Every file. Every plant.
          <br />
          One secure place.
        </h1>
        <p className="text-white/80 text-base sm:text-lg max-w-xl mt-6 drop-shadow-sm">
          The internal file sharing platform connecting Main Factory and Branch Office —
          secure, role-based access for every employee.
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="mt-10 h-12 px-8 bg-white text-brand hover:bg-white/90 font-semibold rounded-lg shadow-xl"
        >
          Get started
        </Button>

        <div className="flex gap-10 sm:gap-16 text-white mt-16">
          <div>
            <p className="text-3xl font-bold">2</p>
            <p className="text-white/70 text-sm">Plants</p>
          </div>
          <div>
            <p className="text-3xl font-bold">4</p>
            <p className="text-white/70 text-sm">Departments</p>
          </div>
          <div>
            <p className="text-3xl font-bold">5</p>
            <p className="text-white/70 text-sm">Access Levels</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-white/50 text-xs py-6">
        MOHA File Share System — internal use only
      </footer>
    </div>
  );
}