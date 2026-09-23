"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";

interface PortalHeaderProps {
  isSignUpPage?: boolean;
}

interface PortalBranding {
  hospitalName: string;
  logoURL: string | null;
}

const PORTAL_BRANDING_KEY = "patientcare-portal-hospital-branding";

const isPortalBranding = (value: unknown): value is PortalBranding => {
  if (!value || typeof value !== "object") return false;

  const branding = value as Record<string, unknown>;
  return (
    typeof branding.hospitalName === "string" &&
    (typeof branding.logoURL === "string" || branding.logoURL === null)
  );
};

const getPortalBrandingSnapshot = () =>
  typeof window === "undefined"
    ? null
    : window.localStorage.getItem(PORTAL_BRANDING_KEY);

const subscribeToPortalBranding = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const parsePortalBranding = (savedBranding: string | null) => {
  if (!savedBranding) return null;

  try {
    const parsedBranding: unknown = JSON.parse(savedBranding);
    return isPortalBranding(parsedBranding) ? parsedBranding : null;
  } catch {
    return null;
  }
};

export default function PortalHeader({
  isSignUpPage = false,
}: PortalHeaderProps) {
  const savedBranding = useSyncExternalStore(
    subscribeToPortalBranding,
    getPortalBrandingSnapshot,
    () => null,
  );

  const storedBranding = isSignUpPage
    ? null
    : parsePortalBranding(savedBranding);

  const displayName = storedBranding?.hospitalName ?? "PatientCare";
  const displayLogo = storedBranding?.logoURL;

  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
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
      <nav>
        {isSignUpPage ? (
          <Link
            href="/portal"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Sign In
          </Link>
        ) : (
          <Link
            href="/portal/signup"
            className="text-white text-sm font-medium border border-white/40 px-4 py-2 rounded-full hover:bg-white/20 transition"
          >
            Sign Up
          </Link>
        )}
      </nav>
    </header>
  );
}
