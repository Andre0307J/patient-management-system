"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Stethoscope, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/landing-page-bg.jpg')" }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-cyan-700/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header — Logo + App Name */}
        <header className="flex items-center justify-center pt-12 pb-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/pms-logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="text-white"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white tracking-wide">
                PatientCare
              </h1>
              <p className="text-white/70 text-sm mt-1 font-bold tracking-wide uppercase">
                Medical Management System
              </p>
            </div>
          </div>
        </header>

        {/* Cards */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl">
            <p className="text-center text-white/80 text-sm mb-8 tracking-wide uppercase font-large font-bold">
              Select your access portal
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Admin Card */}
              <button
                onClick={() => router.push("/admin")}
                className="group bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/30 border border-blue-300/40 flex items-center justify-center group-hover:bg-blue-500/50 transition-all duration-300">
                  <ShieldCheck size={32} className="text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Admin Portal
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed font-bold">
                    Hospital administrators — manage patients, appointments,
                    billing, staff and reports.
                  </p>
                </div>
                <span className="mt-2 text-xs font-medium font-bold text-blue-300 group-hover:text-white transition-colors duration-300 uppercase tracking-wider">
                  Login / Sign Up →
                </span>
              </button>

              {/* Portal Card */}
              <button
                onClick={() => router.push("/portal")}
                className="group bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-teal-500/30 border border-teal-300/40 flex items-center justify-center group-hover:bg-teal-500/50 transition-all duration-300">
                  <Stethoscope size={32} className="text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Clinical Portal
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed font-bold">
                    Doctors and nurses — view assigned patients and manage
                    clinical records.
                  </p>
                </div>
                <span className="mt-2 text-xs font-medium font-bold text-teal-300 group-hover:text-white transition-colors duration-300 uppercase tracking-wider">
                  Login / Sign Up →
                </span>
              </button>
            </div>

            <p className="text-center text-white/40 text-md mt-8 font-bold">
              Doctors and nurses require an invite code from their hospital
              admin to sign up.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 text-center pb-6 font-bold">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} PatientCare. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
