"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { toast } from "sonner";

// Routes where HospitalIndex hasn't been written yet
// (during signup flow) — skip verification on these routes
const SIGNUP_ROUTES = [
  "/admin/signup",
  "/admin/verification-sent",
];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [hospitalData, setHospitalData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setHospitalData(null);
        setLoading(false);
        return;
      }

      // During signup, the Auth account is created BEFORE Firestore writes.
      // onAuthStateChanged fires immediately — HospitalIndex doesn't exist yet.
      // Skip the verification check on signup routes to prevent false "Access denied".
      const currentPath = window.location.pathname;
      const isSignupRoute = SIGNUP_ROUTES.some((route) =>
        currentPath.startsWith(route)
      );

      if (isSignupRoute) {
        setUser(firebaseUser);
        setLoading(false);
        return;
      }

      try {
        // Look up HospitalIndex to verify this is an admin account
        const indexDocRef = doc(db, "HospitalIndex", firebaseUser.uid);
        const indexDocSnap = await getDoc(indexDocRef);

        if (!indexDocSnap.exists()) {
          // No HospitalIndex means this isn't an admin account
          toast.error("Access denied. Staff members must use the Staff Portal.");
          await signOut(auth);
          setUser(null);
          setHospitalData(null);
          window.location.href = "/";
          return;
        }

        const hospitalName = indexDocSnap.data().hospitalName;
        const hospitalDocRef = doc(db, "Hospitals", hospitalName);
        const hospitalDocSnap = await getDoc(hospitalDocRef);

        if (!hospitalDocSnap.exists()) {
          toast.error("Hospital record not found. Please contact support.");
          await signOut(auth);
          setUser(null);
          setHospitalData(null);
          window.location.href = "/";
          return;
        }

        setUser(firebaseUser);
        setHospitalData(hospitalDocSnap.data());
      } catch (error) {
        console.error("Error verifying admin account:", error);
        setUser(null);
        setHospitalData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, hospitalData, loading };
}