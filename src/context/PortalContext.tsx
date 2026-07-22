"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  collection,
  FirestoreError,
} from "firebase/firestore";
import { portalDb } from "@/config/firebase";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { Patient, ClinicalRecord, PortalUser } from "@/context/PatientContext";

interface PortalContextType {
  portalUser: PortalUser | null;
  assignedPatients: Patient[];
  loading: boolean;
  addClinicalRecord: (
    patientId: string,
    record: Omit<ClinicalRecord, "id" | "addedBy" | "addedByName" | "addedByRole" | "createdAt">
  ) => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: ReactNode }) {
  const { user } = usePortalAuth();
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !user?.emailVerified) {
      const handleUnauth = setTimeout(() => {
        setPortalUser(null);
        setAssignedPatients([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(handleUnauth);
    }

    let unsubPortalUser: (() => void) | undefined;
    let patientUnsubscribers: (() => void)[] = [];

    const init = async () => {
      try {
        setLoading(true);

        const lookupSnap = await getDoc(doc(portalDb, "PortalUserIndex", user.uid));
        if (!lookupSnap.exists()) {
          setLoading(false);
          return;
        }
        const { hospitalId } = lookupSnap.data();

        // Listen to portal user profile in real time
        unsubPortalUser = onSnapshot(
          doc(portalDb, "Hospitals", hospitalId, "portalUsers", user.uid),
          (snap) => {
            if (snap.exists()) {
              const data = { id: snap.id, ...snap.data() } as PortalUser;
              setPortalUser(data);

              // Clean up old patient listeners before setting up new ones
              patientUnsubscribers.forEach((unsub) => unsub());
              patientUnsubscribers = [];

              if (!data.assignedPatients || data.assignedPatients.length === 0) {
                setAssignedPatients([]);
                setLoading(false);
                return;
              }

              // Set up individual listeners safely using a functional state accumulator
              data.assignedPatients.forEach((patientId) => {
                const unsub = onSnapshot(
                  doc(portalDb, "Hospitals", hospitalId, "patients", patientId),
                  (patientSnap) => {
                    if (patientSnap.exists()) {
                      const completePatientData = {
                        id: patientSnap.id,
                        ...patientSnap.data(),
                      } as Patient;

                      // Use functional state updates to prevent asynchronous race overrides
                      setAssignedPatients((prev) => {
                        const baseMap = new Map(prev.map((p) => [p.id, p]));
                        baseMap.set(patientId, completePatientData);
                        return Array.from(baseMap.values());
                      });
                    } else {
                      setAssignedPatients((prev) => prev.filter((p) => p.id !== patientId));
                    }
                    setLoading(false);
                  },
                  (error: FirestoreError) => {
                    console.error(`Patient ${patientId} listener error:`, error);
                    setLoading(false);
                  }
                );
                patientUnsubscribers.push(unsub);
              });
            } else {
              setPortalUser(null);
              setLoading(false);
            }
          },
          (error: FirestoreError) => {
            console.error("Portal user listener error:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Portal init error:", error);
        setLoading(false);
      }
    };

    init();

    return () => {
      unsubPortalUser?.();
      patientUnsubscribers.forEach((unsub) => unsub());
    };
  }, [user?.uid, user?.emailVerified]);

  const addClinicalRecord = async (
    patientId: string,
    record: Omit<ClinicalRecord, "id" | "addedBy" | "addedByName" | "addedByRole" | "createdAt">
  ) => {
    if (!user || !portalUser) return;
    await addDoc(
      collection(portalDb, "Hospitals", portalUser.hospitalId, "patients", patientId, "clinicalRecords"),
      {
        ...record,
        addedBy: user.uid,
        addedByName: portalUser.fullName,
        addedByRole: portalUser.role,
        createdAt: new Date().toISOString(),
      }
    );
  };

  return (
    <PortalContext.Provider value={{ portalUser, assignedPatients, loading, addClinicalRecord }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used within a PortalProvider");
  return context;
}