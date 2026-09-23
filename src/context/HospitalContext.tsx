"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";

interface HospitalContextType {
  hospitalId: string; // = hospital name (Firestore document ID)
  hospitalName: string;
  logoURL: string | null;
  loading: boolean;
}

const HospitalContext = createContext<HospitalContextType>({
  hospitalId: "",
  hospitalName: "PatientCare",
  logoURL: null,
  loading: true,
});

export function HospitalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hospitalId, setHospitalId] = useState("");
  const [hospitalName, setHospitalName] = useState("PatientCare");
  const [logoURL, setLogoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    let unsubHospital: (() => void) | undefined;

    const init = async () => {
      setHospitalId("");
      setHospitalName("PatientCare");
      setLogoURL(null);
      setLoading(true);

      try {
        // Look up HospitalIndex to get hospital name
        const indexSnap = await getDoc(doc(db, "HospitalIndex", user.uid));
        if (!indexSnap.exists()) {
          setLoading(false);
          return;
        }

        const { hospitalName: name } = indexSnap.data();
        setHospitalId(name);

        // Listen to hospital document for real-time branding updates
        unsubHospital = onSnapshot(
          doc(db, "Hospitals", name),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setHospitalName(data.hospitalName || name);
              setLogoURL(data.logoURL || null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Hospital listener error:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error loading hospital data:", error);
        setLoading(false);
      }
    };

    init();

    return () => {
      unsubHospital?.();
    };
  }, [user?.uid]);

  const value = user?.uid
    ? { hospitalId, hospitalName, logoURL, loading }
    : {
        hospitalId: "",
        hospitalName: "PatientCare",
        logoURL: null,
        loading: false,
      };

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  return useContext(HospitalContext);
}