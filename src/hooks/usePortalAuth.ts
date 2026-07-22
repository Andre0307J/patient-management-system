"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { portalAuth, portalDb } from "@/config/firebase";
import { toast } from "sonner";

export function usePortalAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(portalAuth, async (portalUser) => {
      if (!portalUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // If user is on public routes (login/signup/verification), don't trigger admin check yet
      const publicPaths = [
        "/portal",
        "/portal/signup",
        "/portal/forgot-password",
        "/portal/auth/action",
        "/portal/verification-sent",
      ];

      const isPublicPath = publicPaths.some((path) =>
        window.location.pathname.startsWith(path)
      );

      try {
        // Fast direct lookup in PortalUserIndex
        const indexRef = doc(portalDb, "PortalUserIndex", portalUser.uid);
        const indexSnap = await getDoc(indexRef);

        if (!indexSnap.exists()) {
          // If they are on the signup or verification page, give Firestore time to catch up
          if (isPublicPath) {
            setUser(portalUser);
            setLoading(false);
            return;
          }

          // Real Admin trying to access protected staff pages
          toast.error("Access denied. Admin accounts cannot access the Staff Portal.");
          await signOut(portalAuth);
          setUser(null);

          if (window.location.pathname !== "/portal") {
            window.location.href = "/portal";
          }
          return;
        }

        // User is a valid staff member
        setUser(portalUser);
      } catch (error) {
        console.error("Error verifying portal user role:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}