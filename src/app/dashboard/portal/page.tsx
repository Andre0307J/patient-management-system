"use client";

import { useState, useEffect } from "react";
import { usePatients, PortalUser, InviteCode } from "@/context/PatientContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Copy,
  Trash2,
  UserCheck,
  UserX,
  Stethoscope,
  Users,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function PortalManagementPage() {
  const {
    portalUsers,
    updatePortalUser,
    deletePortalUser,
    patients,
    assignPatientToPortalUser,
    unassignPatientFromPortalUser,
    generateInviteCode,
    deleteInviteCode,
  } = usePatients();

  const [generatingRole, setGeneratingRole] = useState<"doctor" | "nurse" | null>(null);
  const [deleteCodeTarget, setDeleteCodeTarget] = useState<string | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<PortalUser | null>(null);
  const [assignTarget, setAssignTarget] = useState<PortalUser | null>(null);
  const { user } = useAuth();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "InviteCodes"),
      where("hospitalId", "==", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      setInviteCodes(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InviteCode),
      );
    });

    return () => unsub();
  }, [user]);

  const handleGenerateCode = async (role: "doctor" | "nurse") => {
    setGeneratingRole(role);
    try {
      const code = await generateInviteCode(role);
      toast.success(`Invite code generated!`, {
        description: `Share this code with the ${role}: ${code}`,
      });
    } catch (error) {
      toast.error("Failed to generate invite code.");
      console.error(error);
    } finally {
      setGeneratingRole(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied!", {
      description: `Share the code ${code} with the doctor/nurse.`,
    });
  };

  const handleDeleteCode = async () => {
    if (!deleteCodeTarget) return;
    try {
      await deleteInviteCode(deleteCodeTarget);
      toast.success("Invite code deleted.");
    } catch (error) {
      toast.error("Failed to delete invite code.");
      console.error(error);
    }
    setDeleteCodeTarget(null);
  };

  const handleToggleStatus = async (portalUser: PortalUser) => {
    try {
      await updatePortalUser({
        ...portalUser,
        status: portalUser.status === "active" ? "inactive" : "active",
      });
      toast.success(
        `${portalUser.fullName} has been ${portalUser.status === "active" ? "deactivated" : "activated"}.`,
      );
    } catch (error) {
      toast.error("Failed to update status.");
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await deletePortalUser(deleteUserTarget.id);
      toast.success(`${deleteUserTarget.fullName} has been removed.`);
    } catch (error) {
      toast.error("Failed to remove portal user.");
      console.error(error);
    }
    setDeleteUserTarget(null);
  };

  const unusedCodes = inviteCodes.filter((c) => !c.used);
  const usedCodes = inviteCodes.filter((c) => c.used);
  const doctors = portalUsers.filter((p) => p.role === "doctor");
  const nurses = portalUsers.filter((p) => p.role === "nurse");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Portal Management</h1>
        <p className="text-gray-500 mt-1">
          Manage doctor and nurse access to the clinical portal.
        </p>
      </div>

      {/* Generate Invite Codes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Generate Invite Codes</h2>
        <p className="text-xs text-gray-400">
          Generate a unique invite code and share it with a doctor or nurse. Codes expire in 7 days.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => handleGenerateCode("doctor")}
            disabled={generatingRole === "doctor"}
            className="gap-2"
          >
            <Stethoscope size={16} />
            {generatingRole === "doctor" ? "Generating..." : "Generate Doctor Code"}
          </Button>
          <Button
            onClick={() => handleGenerateCode("nurse")}
            disabled={generatingRole === "nurse"}
            variant="outline"
            className="gap-2"
          >
            <Users size={16} />
            {generatingRole === "nurse" ? "Generating..." : "Generate Nurse Code"}
          </Button>
        </div>
      </div>

      {/* Active Invite Codes */}
      {unusedCodes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Active Invite Codes ({unusedCodes.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {unusedCodes.map((code) => (
              <div key={code.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${
                    code.role === "doctor"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {code.role}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-gray-800 tracking-wider">
                      {code.code}
                    </p>
                    <p className="text-xs text-gray-400">
                      Expires {new Date(code.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyCode(code.code)}
                    className="p-1.5 rounded hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    title="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteCodeTarget(code.id)}
                    className="p-1.5 rounded hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                    title="Delete code"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used Invite Codes History */}
      {usedCodes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-600">
              Claimed Invite Codes History ({usedCodes.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {usedCodes.map((code) => (
              <div key={code.id} className="flex items-center justify-between px-5 py-3 bg-gray-50/20">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize opacity-60 ${
                    code.role === "doctor"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {code.role}
                  </span>
                  <span className="font-mono text-sm font-medium text-gray-400 line-through tracking-wider">
                    {code.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 size={12} />
                    <span>
                      Used by: <span className="font-mono">{code.usedBy?.slice(0, 8) ?? "Unknown"}...</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteCodeTarget(code.id)}
                  className="p-1.5 rounded hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                  title="Delete record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portal Users — Doctors */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Doctors ({doctors.length})</h2>
        </div>
        {doctors.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No doctors have joined the portal yet. Generate an invite code to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{doctor.fullName}</p>
                  <p className="text-xs text-gray-400">{doctor.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {doctor.assignedPatients.length} patient{doctor.assignedPatients.length !== 1 ? "s" : ""} assigned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    doctor.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {doctor.status}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setAssignTarget(doctor)}>
                    <RefreshCw size={12} /> Assign Patients
                  </Button>
                  <button
                    onClick={() => handleToggleStatus(doctor)}
                    className="p-1.5 rounded hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    title={doctor.status === "active" ? "Deactivate" : "Activate"}
                  >
                    {doctor.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                  <button
                    onClick={() => setDeleteUserTarget(doctor)}
                    className="p-1.5 rounded hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portal Users — Nurses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Nurses ({nurses.length})</h2>
        </div>
        {nurses.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No nurses have joined the portal yet. Generate an invite code to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {nurses.map((nurse) => (
              <div key={nurse.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{nurse.fullName}</p>
                  <p className="text-xs text-gray-400">{nurse.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {nurse.assignedPatients.length} patient{nurse.assignedPatients.length !== 1 ? "s" : ""} assigned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    nurse.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {nurse.status}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setAssignTarget(nurse)}>
                    <RefreshCw size={12} /> Assign Patients
                  </Button>
                  <button
                    onClick={() => handleToggleStatus(nurse)}
                    className="p-1.5 rounded hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    title={nurse.status === "active" ? "Deactivate" : "Activate"}
                  >
                    {nurse.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                  <button
                    onClick={() => setDeleteUserTarget(nurse)}
                    className="p-1.5 rounded hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Patients Dialog */}
      {assignTarget && (
        <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
          <DialogContent className="w-[90vw] !max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Patients to {assignTarget.fullName}</DialogTitle>
              <DialogDescription>
                Select which patients {assignTarget.fullName} can access in the portal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {patients.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No patients added yet.</p>
              ) : (
                patients.map((patient) => {
                  const isAssigned = assignTarget.assignedPatients.includes(patient.id);
                  return (
                    <div
                      key={patient.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition",
                        isAssigned ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      )}
                      onClick={async () => {
                        if (isAssigned) {
                          await unassignPatientFromPortalUser(patient.id, assignTarget.id);
                          setAssignTarget((prev) =>
                            prev ? { ...prev, assignedPatients: prev.assignedPatients.filter((id) => id !== patient.id) } : null
                          );
                        } else {
                          await assignPatientToPortalUser(patient.id, assignTarget.id);
                          setAssignTarget((prev) =>
                            prev ? { ...prev, assignedPatients: [...prev.assignedPatients, patient.id] } : null
                          );
                        }
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{patient.fullName}</p>
                        <p className="text-xs text-gray-400">{patient.id}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        isAssigned ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        {isAssigned ? "Assigned" : "Not Assigned"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Code Confirmation */}
      <AlertDialog open={!!deleteCodeTarget} onOpenChange={() => setDeleteCodeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invite Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This invite code will be permanently deleted and can no longer be used to join the portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCode} className="bg-red-500 hover:bg-red-600 text-white">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Portal User Confirmation */}
      <AlertDialog open={!!deleteUserTarget} onOpenChange={() => setDeleteUserTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Portal User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-semibold text-gray-800">{deleteUserTarget?.fullName}</span>{" "}
              from the portal. They will no longer be able to access patient records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600 text-white">
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}