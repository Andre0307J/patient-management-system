"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePatients, Patient, ClinicalRecord } from "@/context/PatientContext";
import {
  UserCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditPatientForm from "@/components/dashboard/EditPatientForm";
import PrintPatientRecord from "@/components/dashboard/PrintPatientRecord";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, FirestoreError } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  discharged: "bg-red-100 text-red-600",
};

const recordTypeColors: Record<string, string> = {
  examination:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  diagnosis:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  testResult:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  surgery: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  prescription:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const recordTypeLabels: Record<string, string> = {
  examination: "Examination",
  diagnosis: "Diagnosis",
  testResult: "Test Result",
  surgery: "Surgery",
  prescription: "Prescription",
};

export default function PatientsPage() {
  const { patients, deletePatient } = usePatients();
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.patientStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Load clinical records when a patient is selected
  useEffect(() => {
    if (!selectedPatient || !user) {
      return;
    }

    const unsub = onSnapshot(
      collection(
        db,
        "Hospitals",
        user.uid,
        "patients",
        selectedPatient.id,
        "clinicalRecords",
      ),
      (snap) => {
        const records = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ClinicalRecord)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setClinicalRecords(records);
        setLoadingRecords(false);
      },
      (error: FirestoreError) => {
        console.error("Clinical records listener error:", error);
        setLoadingRecords(false);
      },
    );

    return () => unsub();
  }, [selectedPatient, user]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePatient(deleteTarget.id);
      toast.success("Patient record deleted.", {
        description: `${deleteTarget.fullName} has been removed from the system.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete patient record.", {
        description: "Please check your connection and try again.",
      });
      console.error("Delete patient error:", error);
    }
  };

  const handleCancelDelete = () => {
    toast.info("Deletion cancelled.", {
      description: "No changes were made to the patient record.",
    });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Patients
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage all patient records here.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discharged">Discharged</option>
        </select>
      </div>

      {/* Patient Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <UserCircle size={56} className="mb-3 text-gray-300" />
          <p className="text-sm">
            {patients.length === 0
              ? `No patients added yet. Click "Add New Patient" to get started.`
              : `No patients match your search.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...filtered]
            .sort((a, b) => {
              const dateA = a.createdAt
                ? typeof a.createdAt === "string"
                  ? new Date(a.createdAt).getTime()
                  : ((a.createdAt as { toDate?: () => Date })
                      .toDate?.()
                      .getTime() ?? 0)
                : 0;
              const dateB = b.createdAt
                ? typeof b.createdAt === "string"
                  ? new Date(b.createdAt).getTime()
                  : ((b.createdAt as { toDate?: () => Date })
                      .toDate?.()
                      .getTime() ?? 0)
                : 0;
              return dateA - dateB; // Oldest patients display first, newer ones append after them
            })
            .map((patient) => (
              <div
                key={patient.id}
                className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border cursor-pointer hover:shadow-md hover:border-blue-300 transition overflow-hidden relative"
              >
                <div
                  onClick={() => {
                    setSelectedPatient(patient);
                    setLoadingRecords(true);
                  }}
                >
                  <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-800">
                    {patient.photo ? (
                      <Image
                        src={patient.photo}
                        alt={patient.fullName}
                        fill
                        className="object-cover object-top"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserCircle size={64} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {patient.fullName}
                    </p>
                    <p className="text-xs text-gray-400">{patient.id}</p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        statusColors[patient.patientStatus] ||
                        "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {patient.patientStatus}
                    </span>
                  </div>
                </div>

                {/* Three dots menu */}
                <div className="absolute bottom-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditPatient(patient);
                        }}
                      >
                        <Pencil size={14} /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(patient);
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Patient Detail Dialog */}
      {selectedPatient && (
        <Dialog
          open={!!selectedPatient}
          onOpenChange={() => {
            setSelectedPatient(null);
            setClinicalRecords([]);
            setLoadingRecords(false);
          }}
        >
          <DialogContent className="w-[95vw] !max-w-5xl p-7 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Patient Record</DialogTitle>
              <DialogDescription>
                Full details for {selectedPatient.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex h-[85vh]">
              {/* Left — 40% */}
              <div className="w-[40%] flex flex-col items-center justify-start pt-8 px-6 shrink-0">
                <div className="relative w-full h-72 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {selectedPatient.photo ? (
                    <Image
                      src={selectedPatient.photo}
                      alt={selectedPatient.fullName}
                      fill
                      className="object-cover object-top"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle size={80} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center space-y-1">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {selectedPatient.fullName}
                  </h2>
                  <p className="text-sm text-gray-400">{selectedPatient.id}</p>
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full font-medium capitalize ${
                      statusColors[selectedPatient.patientStatus] ||
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {selectedPatient.patientStatus}
                  </span>
                </div>

                {/* Print button */}
                {/* <div className="w-full mt-6">
                  <PrintPatientRecord patient={selectedPatient} />
                </div> */}
              </div>

              {/* Right — 60% scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Section title="Basic Information">
                  <Row
                    label="Email"
                    value={selectedPatient.email}
                    noCapitalize
                  />
                  <Row label="Phone" value={selectedPatient.phone} />
                  <Row label="Date of Birth" value={selectedPatient.dob} />
                  <Row label="Gender" value={selectedPatient.gender} />
                  <Row
                    label="Nationality"
                    value={selectedPatient.nationality || "N/A"}
                  />
                  <Row
                    label="Blood Type"
                    value={selectedPatient.bloodType || "N/A"}
                  />
                  <Row
                    label="Address"
                    value={`${selectedPatient.address}, ${selectedPatient.city}, ${selectedPatient.state} ${selectedPatient.zip}`}
                  />
                  <Row
                    label="Allergies"
                    value={selectedPatient.allergies || "None"}
                  />
                  <Row
                    label="Medications"
                    value={selectedPatient.medications || "None"}
                  />
                  <Row
                    label="Pre-existing Conditions"
                    value={selectedPatient.conditions || "None"}
                  />
                  {selectedPatient.observations && (
                    <Row
                      label="Observations"
                      value={selectedPatient.observations}
                    />
                  )}
                </Section>

                <Section title="Emergency Contact">
                  <Row label="Name" value={selectedPatient.emergencyName} />
                  <Row label="Phone" value={selectedPatient.emergencyPhone} />
                  <Row
                    label="Relationship"
                    value={selectedPatient.emergencyRelationship}
                  />
                </Section>

                <Section title="Insurance & Admin">
                  <Row
                    label="Insurance Provider"
                    value={selectedPatient.insuranceProvider || "N/A"}
                  />
                  <Row
                    label="Policy Number"
                    value={selectedPatient.insurancePolicy || "N/A"}
                  />
                  <Row
                    label="Assigned Doctor"
                    value={selectedPatient.assignedDoctor || "N/A"}
                  />
                </Section>

                {/* Clinical Records */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Clinical Records
                  </h3>
                  {loadingRecords ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2
                        size={20}
                        className="animate-spin text-blue-500"
                      />
                    </div>
                  ) : clinicalRecords.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-muted rounded-lg px-4 py-6 text-center">
                      <p className="text-sm text-gray-400">
                        No clinical records added yet.
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        Records will appear here once a doctor or nurse adds
                        them via the portal.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clinicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-gray-100 dark:border-border"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                                recordTypeColors[record.type],
                              )}
                            >
                              {recordTypeLabels[record.type] || record.type}
                            </span>
                            <span className="text-xs text-gray-400">
                              by {record.addedByName} ({record.addedByRole})
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {record.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(record.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}{" "}
                            at{" "}
                            {new Date(record.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Observations & Print */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Observations
                  </h3>
                  <PrintPatientRecord
                    patient={selectedPatient}
                    clinicalRecords={clinicalRecords}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Patient Dialog */}
      {editPatient && (
        <Dialog open={!!editPatient} onOpenChange={() => setEditPatient(null)}>
          <DialogContent className="w-[90vw] !max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Patient Record</DialogTitle>
              <DialogDescription>
                Update the details for {editPatient.fullName} ({editPatient.id})
              </DialogDescription>
            </DialogHeader>
            <EditPatientForm
              patient={editPatient}
              onSuccess={() => setEditPatient(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patient Record?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to permanently delete the record for{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {deleteTarget.fullName}
                </span>{" "}
                ({deleteTarget.id}). This action is irreversible and cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>
                No, Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="bg-gray-50 dark:bg-muted rounded-lg divide-y divide-gray-100 dark:divide-border">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  noCapitalize = false,
}: {
  label: string;
  value: string;
  noCapitalize?: boolean;
}) {
  return (
    <div className="flex justify-between px-4 py-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-gray-800 dark:text-gray-200 font-medium text-right max-w-[60%] ${
          noCapitalize ? "lowercase" : "capitalize"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
