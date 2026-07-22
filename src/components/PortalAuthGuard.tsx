"use client";

import { useEffect } from "react";
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

  // Pages an unauthenticated visitor is allowed to visit
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

    // 1. UNAUTHENTICATED USERS (Not logged in)
    if (!user) {
      if (!isPublicRoute) {
        router.replace("/portal");
      }
      return;
    }

    // 2. UNVERIFIED USERS (Logged in, but email not verified)
    if (!user.emailVerified) {
      if (!isVerificationPage) {
        router.replace("/portal/verification-sent");
      }
      return;
    }

    // 3. VERIFIED USERS (Logged in & verified)
    // Send them away from auth/verification pages to dashboard
    if (isAuthPage || isVerificationPage) {
      router.replace("/portal/dashboard");
    }
  }, [user, loading, router, pathname, isPublicRoute, isVerificationPage, isAuthPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    );
  }

  // Guard render checks
  if (!user && !isPublicRoute) return null;
  if (user && !user.emailVerified && !isVerificationPage) return null;

  return <>{children}</>;
}