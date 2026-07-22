"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // 1. Check if this user exists in the Hospitals (Admin) collection
        const adminDocRef = doc(db, "Hospitals", firebaseUser.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          // 2. User exists in Auth, but is NOT a Hospital Admin (e.g. they are a Doctor/Staff)
          toast.error("Access denied. Staff members must use the Staff Portal.");

          // Terminate the active session on the primary auth instance
          await signOut(auth);
          setUser(null);

          // Redirect to root login page
          window.location.href = "/";
          return;
        }

        // 3. User is a valid Admin
        setUser(firebaseUser);
      } catch (error) {
        console.error("Error verifying admin account:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}