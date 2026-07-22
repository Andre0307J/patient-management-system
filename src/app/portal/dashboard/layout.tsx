"use client"; // Must be client-side to use Auth hooks and Next Router

import { PortalProvider } from "@/context/PortalContext";
import PortalShell from "@/components/portal/PortalShell";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// 1. Create an Inner Gatekeeper Component to access the Context state safely
function DashboardGatekeeper({ children }: { children: React.ReactNode }) {
  const { user, loading } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    // If the Firebase session check completes and NO doctor/nurse is logged in
    if (!loading && !user) {
      // Instantly boot them back to the portal login page
      router.replace("/portal");
    }
  }, [user, loading, router]);

  // If we are still checking the session status, show a full-screen loading guard
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm text-gray-500 font-medium">Verifying clinical session...</p>
      </div>
    );
  }

  // If no user exists, render absolutely nothing (null) while the useEffect redirects them
  // This prevents any dashboard components from ever rendering or mounting unauthenticated!
  return <>{user ? children : null}</>;
}

// 2. Wrap everything with PortalProvider so the Shell and Children have context access
export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <DashboardGatekeeper>
        <PortalShell>{children}</PortalShell>
      </DashboardGatekeeper>
    </PortalProvider>
  );
}