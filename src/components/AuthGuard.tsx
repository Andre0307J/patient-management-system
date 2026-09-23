"use client";

import { useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

// Public routes that do not require auth checks
const PUBLIC_ROUTES = [
  "/",
  "/admin",
  "/admin/signup",
  "/admin/verification-sent",
  "/admin/forgot-password",
  "/auth/action",
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Not logged in
      if (!currentUser) {
        setLoading(false);
        const isPublic = PUBLIC_ROUTES.some(
          (route) => pathname === route || pathname.startsWith(route)
        );
        if (!isPublic) {
          router.push("/admin");
        }
        return;
      }

      // 2. Logged in but email not verified
      if (!currentUser.emailVerified) {
        setLoading(false);

        // Allow user to stay on signup and verification pages
        if (
          pathname === "/admin/signup" ||
          pathname === "/admin/verification-sent"
        ) {
          return;
        }

        // Redirect unverified users to verification page
        if (pathname !== "/admin/verification-sent") {
          router.push("/admin/verification-sent");
        }

        // Poll for verification
        if (interval) clearInterval(interval);
        interval = setInterval(async () => {
          try {
            await currentUser.reload();
            if (auth.currentUser?.emailVerified) {
              clearInterval(interval);
              // Send to admin login after verification
              router.push("/admin");
            }
          } catch (error) {
            console.error("AuthGuard polling error:", error);
          }
        }, 5000);

        return;
      }

      // 3. Logged in and verified
      setLoading(false);

      // If verified user lands on verification page, send to admin login
      if (pathname === "/admin/verification-sent") {
        router.push("/admin");
      }
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [pathname, router]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}