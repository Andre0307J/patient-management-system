"use client";

import { useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsVerified(false);
        setLoading(false);
        
        // Not authenticated: force redirect to root login page
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
        return;
      }

      setUser(currentUser);

      // 1. Unverified User Check
      if (!currentUser.emailVerified) {
        setIsVerified(false);
        setLoading(false);
        
        // Redirect to verification pending page
        if (window.location.pathname !== "/verification-sent") {
          window.location.href = "/verification-sent";
        }

        if (interval) clearInterval(interval);

        // Polling to detect verification in real-time
        interval = setInterval(async () => {
          try {
            await currentUser.reload();
            if (auth.currentUser?.emailVerified) {
              clearInterval(interval);
              setIsVerified(true);
              // Send to root login page as per our updated security flow
              window.location.href = "/";
            }
          } catch (error) {
            console.error("AuthGuard polling error:", error);
          }
        }, 5000);
        
        return;
      }

      // 2. Verified Admin User
      setIsVerified(true);
      setLoading(false);

      // If verified user navigates to verification-sent page, return them to login
      if (window.location.pathname === "/verification-sent") {
        window.location.href = "/";
      }
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  // Prevent UI flash or Firestore read permission errors while checking state
  if (loading) {
    return null; // Or a subtle loading spinner
  }

  if (user && !isVerified && window.location.pathname !== "/verification-sent") {
    return null;
  }

  return <>{children}</>;
}