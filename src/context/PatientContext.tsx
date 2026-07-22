"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  FirestoreError,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { generateStaffInviteCode } from "@/lib/generateInviteCode";
import { deleteImage } from "@/lib/uploadImages";

export interface Patient {
  id: string;
  photo: string | null;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  nationality: string;
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  insuranceProvider: string;
  insurancePolicy: string;
  patientStatus: string;
  assignedDoctor: string;
  observations: string;
  clinicalRecords?: string[];
  createdAt?: { toDate?: () => Date } | Timestamp;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface InviteCode {
  id: string;
  code: string;
  role: "doctor" | "nurse";
  used: boolean;
  usedBy?: string;
  createdAt: string;
  expiresAt: string;
  hospitalId: string;
}

export interface PortalUser {
  id: string;
  photo?: string | null;
  fullName: string;
  email: string;
  role: "doctor" | "nurse";
  hospitalId: string;
  assignedPatients: string[];
  status: "active" | "inactive";
  createdAt: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  type: "examination" | "diagnosis" | "testResult" | "surgery" | "prescription";
  content: string;
  addedBy: string;
  addedByName: string;
  addedByRole: "doctor" | "nurse";
  createdAt: string;
}

export interface StaffMember {
  id: string;
  photo: string | null;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  role: string;
  status: "active" | "inactive";
  type: "doctor" | "staff";
  createdAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  service: string;
  amount: number;
  date: string;
  paymentStatus: "paid" | "unpaid" | "partially_paid";
  paymentMethod: "cash" | "card" | "insurance";
}

export interface Notification {
  id: string;
  message: string;
  type: "patient" | "appointment" | "staff" | "billing";
  read: boolean;
  createdAt: string;
}

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, "id">) => Promise<void>;
  updatePatient: (updated: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (updated: Appointment) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  staffMembers: StaffMember[];
  addStaffMember: (id: string, member: Omit<StaffMember, "id">) => Promise<void>;
  updateStaffMember: (updated: StaffMember) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id">) => Promise<void>;
  updateInvoice: (updated: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  generateInviteCode: (role: "doctor" | "nurse") => Promise<string>;
  deleteInviteCode: (id: string) => Promise<void>;
  portalUsers: PortalUser[];
  updatePortalUser: (updated: PortalUser) => Promise<void>;
  deletePortalUser: (id: string) => Promise<void>;
  assignPatientToPortalUser: (
    patientId: string,
    portalUserId: string,
  ) => Promise<void>;
  unassignPatientFromPortalUser: (
    patientId: string,
    portalUserId: string,
  ) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [state, setState] = useState({
    patients: [] as Patient[],
    appointments: [] as Appointment[],
    staffMembers: [] as StaffMember[],
    invoices: [] as Invoice[],
    notifications: [] as Notification[],
    portalUsers: [] as PortalUser[],
    loadedCollections: {
      patients: false,
      appointments: false,
      staff: false,
      billing: false,
      portalUsers: false,
    },
  });

  const {
    patients,
    appointments,
    staffMembers,
    invoices,
    notifications,
    loadedCollections,
  } = state;

  const loading =
    user?.uid && user?.emailVerified
      ? !Object.values(loadedCollections).every(Boolean)
      : false;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const subCol = (name: string) => {
    if (!user?.uid) throw new Error("No authenticated user found.");
    return collection(db, "Hospitals", user.uid, name);
  };

  const handleFirestoreListenerError = (
    collectionName: string,
    error: FirestoreError,
  ) => {
    console.error(`Firestore ${collectionName} listener error:`, error);
  };

  useEffect(() => {
    if (!user?.uid || !user?.emailVerified) {
      const timer = setTimeout(() => {
        setState((prev) => {
          if (
            prev.patients.length === 0 &&
            prev.appointments.length === 0 &&
            prev.staffMembers.length === 0 &&
            prev.invoices.length === 0 &&
            prev.notifications.length === 0 &&
            prev.portalUsers.length === 0 &&
            !prev.loadedCollections.patients &&
            !prev.loadedCollections.appointments &&
            !prev.loadedCollections.staff &&
            !prev.loadedCollections.billing &&
            !prev.loadedCollections.portalUsers
          ) {
            return prev;
          }
          return {
            patients: [],
            appointments: [],
            staffMembers: [],
            invoices: [],
            notifications: [],
            portalUsers: [],
            loadedCollections: {
              patients: false,
              appointments: false,
              staff: false,
              billing: false,
              portalUsers: false,
            },
          };
        });
      }, 0);
      return () => clearTimeout(timer);
    }

    const unsubPatients = onSnapshot(
      collection(db, "Hospitals", user.uid, "patients"),
      (snap) => {
        setState((prev) => ({
          ...prev,
          patients: snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Patient,
          ),
          loadedCollections: { ...prev.loadedCollections, patients: true },
        }));
      },
      (error: FirestoreError) => {
        handleFirestoreListenerError("Patients", error);
        setState((prev) => ({
          ...prev,
          loadedCollections: { ...prev.loadedCollections, patients: true },
        }));
      },
    );

    const unsubAppointments = onSnapshot(
      collection(db, "Hospitals", user.uid, "appointments"),
      (snap) => {
        setState((prev) => ({
          ...prev,
          appointments: snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Appointment,
          ),
          loadedCollections: { ...prev.loadedCollections, appointments: true },
        }));
      },
      (error: FirestoreError) => {
        handleFirestoreListenerError("Appointments", error);
        setState((prev) => ({
          ...prev,
          loadedCollections: { ...prev.loadedCollections, appointments: true },
        }));
      },
    );

    const unsubStaff = onSnapshot(
      collection(db, "Hospitals", user.uid, "staff"),
      (snap) => {
        setState((prev) => ({
          ...prev,
          staffMembers: snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as StaffMember,
          ),
          loadedCollections: { ...prev.loadedCollections, staff: true },
        }));
      },
      (error: FirestoreError) => {
        handleFirestoreListenerError("Staff", error);
        setState((prev) => ({
          ...prev,
          loadedCollections: { ...prev.loadedCollections, staff: true },
        }));
      },
    );

    const unsubBilling = onSnapshot(
      collection(db, "Hospitals", user.uid, "billing"),
      (snap) => {
        setState((prev) => ({
          ...prev,
          invoices: snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Invoice,
          ),
          loadedCollections: { ...prev.loadedCollections, billing: true },
        }));
      },
      (error: FirestoreError) => {
        handleFirestoreListenerError("Billing", error);
        setState((prev) => ({
          ...prev,
          loadedCollections: { ...prev.loadedCollections, billing: true },
        }));
      },
    );

    const unsubPortalUsers = onSnapshot(
      collection(db, "Hospitals", user.uid, "portalUsers"),
      (snap) => {
        setState((prev) => ({
          ...prev,
          portalUsers: snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as PortalUser,
          ),
          loadedCollections: { ...prev.loadedCollections, portalUsers: true },
        }));
      },
      (error: FirestoreError) => {
        handleFirestoreListenerError("PortalUsers", error);
        setState((prev) => ({
          ...prev,
          loadedCollections: { ...prev.loadedCollections, portalUsers: true },
        }));
      },
    );

    const unsubNotifications = onSnapshot(
      collection(db, "Hospitals", user.uid, "notifications"),
      (snap) => {
        const notifs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Notification)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setState((prev) => ({ ...prev, notifications: notifs }));
      },
      (error: FirestoreError) => {
        handleFirestoreListenerError("Notifications", error);
      },
    );

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubStaff();
      unsubBilling();
      unsubPortalUsers();
      unsubNotifications();
    };
  }, [user?.uid, user?.emailVerified]);

  // ─── Invite Codes (Root Collection) ───────────────────────────────
  const generateInviteCode = async (
    role: "doctor" | "nurse",
  ): Promise<string> => {
    if (!user) return "";
    const code = await generateStaffInviteCode({ hospitalId: user.uid, role });
    await createNotification(
      `Invite code ${code} was generated for a ${role}.`,
      "staff",
    );
    return code;
  };

  const deleteInviteCode = async (id: string) => {
    await deleteDoc(doc(db, "InviteCodes", id));
  };

  // ─── Portal Users ─────────────────────────────────────────────────
  const updatePortalUser = async (updated: PortalUser) => {
    if (!user) return;
    const { id, ...data } = updated;
    await updateDoc(doc(db, "Hospitals", user.uid, "portalUsers", id), data);
  };

  const deletePortalUser = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "Hospitals", user.uid, "portalUsers", id));
  };

  const assignPatientToPortalUser = async (
    patientId: string,
    portalUserId: string,
  ) => {
    if (!user) return;
    const portalUser = state.portalUsers.find((p) => p.id === portalUserId);
    if (!portalUser) return;
    const updatedPatients = [
      ...new Set([...portalUser.assignedPatients, patientId]),
    ];
    await updateDoc(
      doc(db, "Hospitals", user.uid, "portalUsers", portalUserId),
      {
        assignedPatients: updatedPatients,
      },
    );
  };

  const unassignPatientFromPortalUser = async (
    patientId: string,
    portalUserId: string,
  ) => {
    if (!user) return;
    const portalUser = state.portalUsers.find((p) => p.id === portalUserId);
    if (!portalUser) return;
    const updatedPatients = portalUser.assignedPatients.filter(
      (id) => id !== patientId,
    );
    await updateDoc(
      doc(db, "Hospitals", user.uid, "portalUsers", portalUserId),
      {
        assignedPatients: updatedPatients,
      },
    );
  };

  // ─── Notifications ────────────────────────────────────────────────
  const createNotification = async (
    message: string,
    type: Notification["type"],
  ) => {
    if (!user) return;
    await addDoc(collection(db, "Hospitals", user.uid, "notifications"), {
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, "Hospitals", user.uid, "notifications", id), {
      read: true,
    });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDoc(doc(db, "Hospitals", user.uid, "notifications", n.id), {
          read: true,
        }),
      ),
    );
  };

  // ─── Patients ─────────────────────────────────────────────────────
  const addPatient = async (patient: Omit<Patient, "id">) => {
    if (!user?.uid) {
      throw new Error("You must be logged in to add a patient.");
    }
    await addDoc(subCol("patients"), {
      ...patient,
      createdAt: serverTimestamp(),
    });
    await createNotification(
      `New patient ${patient.fullName} was added.`,
      "patient",
    );
  };

  const updatePatient = async (updated: Patient) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "Hospitals", user!.uid, "patients", id), data);
    await createNotification(
      `Patient ${updated.fullName}'s record was updated.`,
      "patient",
    );
  };

  const deletePatient = async (id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (patient?.photo) {
      await deleteImage(patient.photo, storage); // Don't forget to pass the patient.photo variable argument when we migrate to Firebase Storage Blaze Plan.
    }
    await deleteDoc(doc(db, "Hospitals", user!.uid, "patients", id));
    await createNotification(
      `Patient ${patient?.fullName ?? id} was removed from the system.`,
      "patient",
    );
  };

  // ─── Appointments ──────────────────────────────────────────────────
  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    await addDoc(subCol("appointments"), {
      ...appointment,
      createdAt: serverTimestamp(),
    });
    await createNotification(
      `Appointment scheduled for ${appointment.patientName} with ${appointment.doctor} on ${appointment.date} at ${appointment.time}.`,
      "appointment",
    );
  };

  const updateAppointment = async (updated: Appointment) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "Hospitals", user!.uid, "appointments", id), data);
    await createNotification(
      `Appointment for ${updated.patientName} was updated to ${updated.status}.`,
      "appointment",
    );
  };

  const deleteAppointment = async (id: string) => {
    const appointment = appointments.find((a) => a.id === id);
    await deleteDoc(doc(db, "Hospitals", user!.uid, "appointments", id));
    await createNotification(
      `Appointment for ${appointment?.patientName ?? id} with ${appointment?.doctor ?? ""} was cancelled.`,
      "appointment",
    );
  };

  // ─── Staff ────────────────────────────────────────────────────────
  // Update your addStaffMember function in PatientContext.tsx to this:
const addStaffMember = async (id: string, member: Omit<StaffMember, "id">) => {
  // 1. Use the explicitly passed id string directly
  const docRef = doc(subCol("staff"), id);

  // 2. Save the rest of the payload data
  await setDoc(docRef, { 
    ...member, 
    createdAt: serverTimestamp() 
  });

  await createNotification(
    `New ${member.type} ${member.fullName} was added.`,
    "staff"
  );
};

  const updateStaffMember = async (updated: StaffMember) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "Hospitals", user!.uid, "staff", id), data);
    await createNotification(
      `${updated.type === "doctor" ? "Doctor" : "Staff member"} ${updated.fullName}'s record was updated.`,
      "staff",
    );
  };

  const deleteStaffMember = async (id: string) => {
    const member = staffMembers.find((s) => s.id === id);
    if (member?.photo) {
      await deleteImage(member.photo, storage); // Don't forget to pass the member.photo variable argument when we migrate to Firebase Storage Blaze Plan.
    }
    await deleteDoc(doc(db, "Hospitals", user!.uid, "staff", id));
    await createNotification(
      `${member?.type === "doctor" ? "Doctor" : "Staff member"} ${member?.fullName ?? id} was removed from the system.`,
      "staff",
    );
  };

  // ─── Billing ──────────────────────────────────────────────────────
  const addInvoice = async (invoice: Omit<Invoice, "id">) => {
    await addDoc(subCol("billing"), {
      ...invoice,
      createdAt: serverTimestamp(),
    });
    await createNotification(
      `New invoice ${invoice.invoiceNumber} created for ${invoice.patientName}.`,
      "billing",
    );
  };

  const updateInvoice = async (updated: Invoice) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "Hospitals", user!.uid, "billing", id), data);
    await createNotification(
      `Invoice ${updated.invoiceNumber} for ${updated.patientName} was updated.`,
      "billing",
    );
  };

  const deleteInvoice = async (id: string) => {
    const invoice = invoices.find((i) => i.id === id);
    await deleteDoc(doc(db, "Hospitals", user!.uid, "billing", id));
    await createNotification(
      `Invoice ${invoice?.invoiceNumber ?? id} for ${invoice?.patientName ?? ""} was deleted.`,
      "billing",
    );
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        addPatient,
        updatePatient,
        deletePatient,
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        staffMembers,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        loading,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        generateInviteCode,
        deleteInviteCode,
        portalUsers: state.portalUsers,
        updatePortalUser,
        deletePortalUser,
        assignPatientToPortalUser,
        unassignPatientFromPortalUser,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context)
    throw new Error("usePatients must be used within a PatientProvider");
  return context;
}
