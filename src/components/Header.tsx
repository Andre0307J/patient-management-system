"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHospital } from "@/context/HospitalContext";

interface HeaderProps {
  isSignUpPage?: boolean;
  isVerificationSentPage?: boolean;
}

export default function Header({ 
  isSignUpPage = false,
  isVerificationSentPage = false
}: HeaderProps) {
  const { hospitalId, hospitalName, logoURL } = useHospital();
  const [storedBranding, setStoredBranding] = useState<{
    hospitalName: string;
    logoURL: string | null;
  } | null>(null);

  useEffect(() => {
    if (hospitalId) {
      window.localStorage.setItem(
        "patientcare-hospital-branding",
        JSON.stringify({ hospitalName, logoURL }),
      );
    }

    if (!hospitalId && !isSignUpPage && !isVerificationSentPage) {
      const timer = window.setTimeout(() => {
        const savedBranding = window.localStorage.getItem(
          "patientcare-hospital-branding",
        );
        if (savedBranding) {
          try {
            setStoredBranding(JSON.parse(savedBranding));
          } catch {
            window.localStorage.removeItem("patientcare-hospital-branding");
          }
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [hospitalId, hospitalName, logoURL, isSignUpPage, isVerificationSentPage]);

  const displayName = hospitalId
    ? hospitalName
    : (storedBranding?.hospitalName ?? "PatientCare");
  const displayLogo = hospitalId ? logoURL : storedBranding?.logoURL;

  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-transparent">
      {/* Logo + App Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center">
          {displayLogo ? (
            <Image
              src={displayLogo}
              alt={`${displayName} logo`}
              width={40}
              height={40}
              className="w-full h-full object-contain"
              unoptimized
            />
          ) : (
            <Image
              src="/pms-logo.png"
              alt="PatientCare logo"
              width={40}
              height={40}
              className="w-full h-full object-cover text-white"
            />
          )}
        </div>
        <span className="text-white font-semibold text-xl tracking-wide">
          {displayName}
        </span>
      </div>

      {/* Nav link — swaps between Sign Up and Login */}
      <nav>
        {isSignUpPage || isVerificationSentPage ? (
          <Link
            href="/admin"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Login
          </Link>
        ) : (
          <Link
            href="/admin/signup"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Sign Up
          </Link>
        )}
      </nav>
    </header>
  );
}