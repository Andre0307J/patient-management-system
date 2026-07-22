"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { usePortal } from "@/context/PortalContext";
import { ClinicalRecord } from "@/context/PatientContext";
import { portalDb } from "@/config/firebase";
import { collection, onSnapshot, FirestoreError } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCircle, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const recordTypeColors: Record<string, string> = {
  examination: "bg-blue-100 text-blue-700",
  diagnosis: "bg-purple-100 text-purple-700",
  testResult: "bg-yellow-100 text-yellow-700",
  surgery: "bg-red-100 text-red-700",
  prescription: "bg-green-100 text-green-700",
};

const recordTypeLabels: Record<string, string> = {
  examination: "Examination",
  diagnosis: "Diagnosis",
  testResult: "Test Result",
  surgery: "Surgery",
  prescription: "Prescription",
};

export default function PortalPatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const { portalUser, assignedPatients, addClinicalRecord } = usePortal();

  const patient = assignedPatients.find((p) => p.id === id);
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [openAddRecord, setOpenAddRecord] = useState(false);

  // Derived Initial State — Computes correctly on mount without cascading renders
  const [recordType, setRecordType] = useState<ClinicalRecord["type"]>(() => 
    portalUser?.role === "nurse" ? "prescription" : "examination"
  );
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clinical records
  useEffect(() => {
    if (!portalUser || !id) return;

    const unsub = onSnapshot(
      collection(
        portalDb,
        "Hospitals",
        portalUser.hospitalId,
        "patients",
        id as string,
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
  }, [portalUser, id]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter the record content.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addClinicalRecord(id as string, {
        type: recordType,
        content,
        patientId: id as string,
      });
      toast.success("Clinical record added successfully.");
      setContent("");
      setOpenAddRecord(false);
    } catch (error) {
      toast.error("Failed to add clinical record.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine available record types based on role
  const availableTypes =
    portalUser?.role === "nurse"
      ? [{ value: "prescription", label: "Prescription" }]
      : [
          { value: "examination", label: "Examination" },
          { value: "diagnosis", label: "Diagnosis" },
          { value: "testResult", label: "Test Result" },
          { value: "surgery", label: "Surgery" },
          { value: "prescription", label: "Prescription" },
        ];

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm">Patient not found or not assigned to you.</p>
        <button
          onClick={() => router.back()}
          className="text-teal-600 text-sm hover:underline mt-2"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={16} /> Back to patients
      </button>

      {/* Patient Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
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
              <UserCircle size={36} className="text-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-800">
              {patient.fullName}
            </h1>
            <p className="text-sm text-gray-400">{patient.id}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">DOB: {patient.dob}</span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-500 capitalize">
                {patient.gender}
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                Blood: {patient.bloodType || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Basic medical info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Allergies</p>
            <p className="text-sm text-gray-700">
              {patient.allergies || "None"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Current Medications</p>
            <p className="text-sm text-gray-700">
              {patient.medications || "None"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pre-existing Conditions</p>
            <p className="text-sm text-gray-700">
              {patient.conditions || "None"}
            </p>
          </div>
          {patient.observations && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-gray-400">Observations</p>
              <p className="text-sm text-gray-700">{patient.observations}</p>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            Clinical Records
          </h2>
          <Button
            onClick={() => {
              setRecordType(portalUser?.role === "nurse" ? "prescription" : "examination");
              setOpenAddRecord(true);
            }}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
            size="sm"
          >
            <Plus size={14} />
            {portalUser?.role === "nurse"
              ? "Add Prescription Note"
              : "Add Record"}
          </Button>
        </div>

        {loadingRecords ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : clinicalRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-12 text-center text-gray-400">
            <p className="text-sm">No clinical records yet.</p>
            <p className="text-xs mt-1">
              {portalUser?.role === "nurse"
                ? "Add a prescription note to get started."
                : "Add an examination, diagnosis or other record to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clinicalRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          recordTypeColors[record.type],
                        )}
                      >
                        {recordTypeLabels[record.type]}
                      </span>
                      <span className="text-xs text-gray-400">
                        by {record.addedByName} ({record.addedByRole})
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {record.content}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(record.createdAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date(record.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Clinical Record Dialog */}
      <Dialog open={openAddRecord} onOpenChange={setOpenAddRecord}>
        <DialogContent className="w-[90vw] !max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {portalUser?.role === "nurse"
                ? "Add Prescription Note"
                : "Add Clinical Record"}
            </DialogTitle>
            <DialogDescription>
              {portalUser?.role === "nurse"
                ? "Record prescription drugs and dosages for this patient."
                : "Add a clinical record for this patient."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRecord} className="space-y-4">
            {/* Record type — nurses only see prescription */}
            {portalUser?.role === "doctor" && (
              <div className="space-y-1">
                <Label>Record Type</Label>
                <Select
                  value={recordType}
                  onValueChange={(val) =>
                    setRecordType(val as ClinicalRecord["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>
                {portalUser?.role === "nurse"
                  ? "Prescription (Drug name & Dosage)"
                  : "Content / Notes"}
              </Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  portalUser?.role === "nurse"
                    ? "e.g. Amoxicillin 500mg — 3 times daily for 7 days\nParacetamol 1000mg — as needed for pain"
                    : recordType === "examination"
                      ? "e.g. Patient presents with fever of 38.5°C, complains of sore throat..."
                      : recordType === "diagnosis"
                        ? "e.g. Acute tonsillitis, bacterial infection..."
                        : recordType === "testResult"
                          ? "e.g. Blood test results: WBC 11.2, RBC 4.5..."
                          : recordType === "surgery"
                            ? "e.g. Appendectomy performed under general anaesthesia..."
                            : "e.g. Amoxicillin 500mg — 3 times daily for 7 days..."
                }
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddRecord(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}