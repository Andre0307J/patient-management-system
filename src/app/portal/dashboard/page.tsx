"use client";

import { useState } from "react";
import Image from "next/image";
import { usePortal } from "@/context/PortalContext";
//import { Patient } from "@/context/PatientContext";
import { UserCircle, ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  discharged: "bg-red-100 text-red-600",
};

export default function PortalDashboardPage() {
  const { portalUser, assignedPatients } = usePortal();
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = assignedPatients.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, {portalUser?.fullName}
        </h1>
        <p className="text-gray-500 mt-1">
          You have {assignedPatients.length} patient{assignedPatients.length !== 1 ? "s" : ""} assigned to you.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search patients by name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 h-9 px-3 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {/* Patient List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users size={48} className="mb-3 text-gray-300" />
          <p className="text-sm">
            {assignedPatients.length === 0
              ? "No patients have been assigned to you yet."
              : "No patients match your search."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map((patient) => (
              <div
                key={patient.id}
                onClick={() => router.push(`/portal/dashboard/patients/${patient.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
              >
                {/* Photo */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {patient.photo ? (
                    <Image
                      src={patient.photo}
                      alt={patient.fullName}
                      fill
                      sizes="96px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <UserCircle size={28} className="text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{patient.fullName}</p>
                  <p className="text-xs text-gray-400">{patient.id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      statusColors[patient.patientStatus] || "bg-gray-100 text-gray-500"
                    }`}>
                      {patient.patientStatus}
                    </span>
                    {patient.assignedDoctor && (
                      <span className="text-xs text-gray-400">
                        Dr. {patient.assignedDoctor}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}