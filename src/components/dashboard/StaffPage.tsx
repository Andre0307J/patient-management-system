"use client";

import { useState } from "react";
import Image from "next/image";
import { usePatients, StaffMember } from "@/context/PatientContext";
import { UserCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import StaffForm from "./StaffForm";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
};

interface StaffPageProps {
  type: "doctor" | "staff";
}

export default function StaffPage({ type }: StaffPageProps) {
  const { staffMembers, deleteStaffMember } = usePatients();
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const filtered = staffMembers.filter((s) => {
    const matchesType = s.type === type;
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStaffMember(deleteTarget.id);
      toast.success("Record deleted.", {
        description: `${deleteTarget.fullName} (${deleteTarget.id}) has been removed from the system.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete record.", {
        description: "Please check your connection and try again.",
      });
      console.error("Delete staff error:", error);
    }
  };

  const handleCancelDelete = () => {
    toast.info("Deletion cancelled.", {
      description: "No changes were made.",
    });
    setDeleteTarget(null);
  };

  const title = type === "doctor" ? "Doctors" : "Staff";
  const singular = type === "doctor" ? "Doctor" : "Staff Member";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <p className="text-gray-500 mt-1">
            Manage all {title.toLowerCase()} records here.
          </p>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder={`Search by name or ID...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 h-9 px-3 text-sm rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <UserCircle size={56} className="mb-3 text-gray-300" />
          <p className="text-sm">
            {staffMembers.filter((s) => s.type === type).length === 0
              ? `No ${title.toLowerCase()} added yet. Click "Add ${singular}" to get started.`
              : `No ${title.toLowerCase()} match your search.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...filtered]
            .sort(
              (a, b) =>
                new Date(a.createdAt ?? 0).getTime() -
                new Date(b.createdAt ?? 0).getTime(),
            )
            .map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition overflow-hidden relative"
              >
                <div onClick={() => setSelectedMember(member)}>
                  <div className="relative w-full h-56 bg-gray-100">
                    {member.photo ? (
                      <Image
                        src={member.photo}
                        alt={member.fullName}
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
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {member.fullName}
                    </p>
                    <p className="text-xs text-gray-400">{member.id}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {member.role}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[member.status] || "bg-gray-100 text-gray-500"}`}
                    >
                      {member.status}
                    </span>
                  </div>
                </div>

                {/* Three dots menu */}
                <div className="absolute bottom-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded-full hover:bg-gray-100 transition focus:outline-none"
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
                          setEditTarget(member);
                        }}
                      >
                        <Pencil size={14} /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(member);
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

      {/* Detail Dialog */}
      {selectedMember && (
        <Dialog
          open={!!selectedMember}
          onOpenChange={() => setSelectedMember(null)}
        >
          <DialogContent className="w-[95vw] max-w-5xl! p-7 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>{singular} Record</DialogTitle>
              <DialogDescription>
                Full details for {selectedMember.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex h-[85vh]">
              {/* Left */}
              <div className="w-[40%] flex flex-col items-center justify-start pt-8 px-6 shrink-0">
                <div className="relative w-full h-72 rounded-xl overflow-hidden bg-gray-200">
                  {selectedMember.photo ? (
                    <Image
                      src={selectedMember.photo}
                      alt={selectedMember.fullName}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle size={80} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center space-y-1">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedMember.fullName}
                  </h2>
                  <p className="text-sm text-gray-400">{selectedMember.id}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {selectedMember.role}
                  </p>
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full font-medium capitalize ${statusColors[selectedMember.status] || "bg-gray-100 text-gray-500"}`}
                  >
                    {selectedMember.status}
                  </span>
                </div>
              </div>

              {/* Right */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Section title="Contact Information">
                  <Row
                    label="Email"
                    value={selectedMember.email}
                    noCapitalize
                  />
                  <Row label="Phone" value={selectedMember.phone} />
                </Section>
                <Section title="Professional Details">
                  <Row label="Role" value={selectedMember.role} />
                  <Row label="Department" value={selectedMember.department} />
                  <Row
                    label="Specialization"
                    value={selectedMember.specialization || "N/A"}
                  />
                </Section>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
          <DialogContent className="w-[90vw] max-w-xl!">
            <DialogHeader>
              <DialogTitle>Edit {singular}</DialogTitle>
              <DialogDescription>
                Update details for {editTarget.fullName}.
              </DialogDescription>
            </DialogHeader>
            <StaffForm
              type={type}
              existing={editTarget}
              onSuccess={() => setEditTarget(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {singular} Record?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to permanently delete the record for{" "}
                <span className="font-semibold text-gray-800">
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
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
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
      <span className="text-gray-500">{label}</span>
      <span
        className={`text-gray-800 font-medium text-right max-w-[60%] ${noCapitalize ? "lowercase" : "capitalize"}`}
      >
        {value}
      </span>
    </div>
  );
}
