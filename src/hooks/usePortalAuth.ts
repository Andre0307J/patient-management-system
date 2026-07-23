"use client";

import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { portalAuth, portalDb } from "@/config/firebase";
import { toast } from "sonner";

export function usePortalAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isEvaluating = useRef(false);
  const hasResolvedOnce = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(portalAuth, async (portalUser) => {
      // Avoid overlapping async Firestore calls
      if (isEvaluating.current) return;
      isEvaluating.current = true;

      if (!portalUser) {
        setUser(null);
        setLoading(false);
        hasResolvedOnce.current = true;
        isEvaluating.current = false;
        return;
      }

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
        const indexRef = doc(portalDb, "PortalUserIndex", portalUser.uid);
        const indexSnap = await getDoc(indexRef);

        if (!indexSnap.exists()) {
          if (isPublicPath) {
            setUser(portalUser);
            setLoading(false);
            hasResolvedOnce.current = true;
            isEvaluating.current = false;
            return;
          }

          toast.error("Access denied. Admin accounts cannot access the Staff Portal.");
          await signOut(portalAuth);
          setUser(null);

          if (window.location.pathname !== "/portal") {
            window.location.href = "/portal";
          }
          return;
        }

        setUser(portalUser);
      } catch (error) {
        console.error("Error verifying portal user role:", error);
        setUser(null);
      } finally {
        setLoading(false);
        hasResolvedOnce.current = true;
        isEvaluating.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}