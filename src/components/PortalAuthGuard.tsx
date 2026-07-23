"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { Loader2 } from "lucide-react";

export default function PortalAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = usePortalAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);

  const publicRoutes = [
    "/portal",
    "/portal/signup",
    "/portal/forgot-password",
    "/portal/auth/action",
    "/portal/verification-sent",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  const isVerificationPage = pathname === "/portal/verification-sent";
  const isAuthPage =
    pathname === "/portal" ||
    pathname === "/portal/signup" ||
    pathname === "/portal/forgot-password";

  useEffect(() => {
    if (loading) return;
    if (isRedirecting.current) return;

    // 1. UNAUTHENTICATED USERS
    if (!user) {
      if (!isPublicRoute) {
        isRedirecting.current = true;
        router.replace("/portal");
      }
      return;
    }

    // 2. UNVERIFIED USERS
    if (!user.emailVerified) {
      if (!isVerificationPage) {
        isRedirecting.current = true;
        router.replace("/portal/verification-sent");
      }
      return;
    }

    // 3. VERIFIED USERS — redirect away from auth pages
    if (isAuthPage || isVerificationPage) {
      isRedirecting.current = true;
      router.replace("/portal/dashboard");
    }
  }, [user, loading, router, pathname, isPublicRoute, isVerificationPage, isAuthPage]);

  // Reset redirect lock when pathname changes
  useEffect(() => {
    isRedirecting.current = false;
  }, [pathname]);

  if (loading) {
  return (
    // Replace the URL with the exact path to your background image
    // and match the same background classes (bg-cover, bg-center, etc.) you used on the Auth pages
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/portal-bg-image.jpg')" }} 
    >
      {/* Optional: Add a subtle overlay if your auth pages have one (e.g., bg-black/40) */}
      <div className="absolute inset-0 bg-black/30" /> 
      
      {/* The spinner stays on top, matching the style of your cards */}
      <div className="relative z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl">
        <Loader2 size={32} className="animate-spin text-white mb-4" />
        <p className="text-white font-medium">Securing session...</p>
      </div>
    </div>
  );
}

  // Guard render checks
  if (!user && !isPublicRoute) return null;
  if (user && !user.emailVerified && !isVerificationPage) return null;

  return <>{children}</>;
}