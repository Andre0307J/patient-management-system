"use client";

import { useMemo } from "react";
import { usePatients } from "@/context/PatientContext";
import {
  Users,
  CalendarDays,
  CreditCard,
  Stethoscope,
  Download,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";
import Papa from "papaparse";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  discharged: "bg-red-100 text-red-600",
};

export default function ReportsPage() {
  const { patients, appointments, invoices, staffMembers } = usePatients();
  const { symbol } = useCurrency();

  // --- Patient Stats ---
  const totalPatients = patients.length;
  const activePatients = patients.filter(
    (p) => p.patientStatus === "active",
  ).length;
  const inactivePatients = patients.filter(
    (p) => p.patientStatus === "inactive",
  ).length;
  const dischargedPatients = patients.filter(
    (p) => p.patientStatus === "discharged",
  ).length;

  // --- Appointment Stats ---
  const totalAppointments = appointments.length;
  const scheduledAppointments = appointments.filter(
    (a) => a.status === "scheduled",
  ).length;
  const completedAppointments = appointments.filter(
    (a) => a.status === "completed",
  ).length;
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled",
  ).length;

  // --- Billing Stats ---
  const totalRevenue = invoices
    .filter((i) => i.paymentStatus === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid = invoices
    .filter((i) => i.paymentStatus === "unpaid")
    .reduce((sum, i) => sum + i.amount, 0);

  // --- Staff Stats ---
  const totalDoctors = staffMembers.filter((s) => s.type === "doctor").length;
  const totalStaff = staffMembers.filter((s) => s.type === "staff").length;

  // --- Charts ---
  const patientStatusData = [
    { name: "Active", value: activePatients, color: "#22c55e" },
    { name: "Inactive", value: inactivePatients, color: "#94a3b8" },
    { name: "Discharged", value: dischargedPatients, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const appointmentStatusData = [
    { name: "Scheduled", value: scheduledAppointments, color: "#3b82f6" },
    { name: "Completed", value: completedAppointments, color: "#22c55e" },
    { name: "Cancelled", value: cancelledAppointments, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const genderData = [
    {
      name: "Male",
      value: patients.filter((p) => p.gender === "male").length,
      color: "#3b82f6",
    },
    {
      name: "Female",
      value: patients.filter((p) => p.gender === "female").length,
      color: "#ec4899",
    },
    {
      name: "Other",
      value: patients.filter((p) => p.gender === "other").length,
      color: "#a855f7",
    },
  ].filter((d) => d.value > 0);

  const revenueOverTime = useMemo(() => {
    const months: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (inv.paymentStatus === "paid" && inv.date) {
        const d = new Date(inv.date);
        const key = d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        months[key] = (months[key] || 0) + inv.amount;
      }
    });
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      result.push({
        month: d.toLocaleString("default", { month: "short" }),
        revenue: months[key] || 0,
      });
    }
    return result;
  }, [invoices]);

  // --- CSV Export ---
  const handleExport = () => {
    const data = patients.map((p) => ({
      "Patient ID": p.id,
      "Full Name": p.fullName,
      Email: p.email,
      Phone: p.phone,
      "Date of Birth": p.dob,
      Gender: p.gender,
      "Blood Type": p.bloodType,
      Status: p.patientStatus,
      "Assigned Doctor": p.assignedDoctor,
      "Insurance Provider": p.insuranceProvider,
      City: p.city,
      State: p.state,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "patients_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summaryCards = [
    {
      label: "Total Patients",
      value: totalPatients,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Appointments",
      value: totalAppointments,
      icon: CalendarDays,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Revenue",
      value: `${symbol}${totalRevenue.toFixed(2)}`,
      icon: CreditCard,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Unpaid Invoices",
      value: `${symbol}${totalUnpaid.toFixed(2)}`,
      icon: CreditCard,
      color: "bg-red-50 text-red-500",
    },
    {
      label: "Doctors",
      value: totalDoctors,
      icon: Stethoscope,
      color: "bg-orange-50 text-orange-500",
    },
    {
      label: "Staff Members",
      value: totalStaff,
      icon: Users,
      color: "bg-gray-50 text-gray-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Reports & Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          A full overview of your system&apos;s data.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Over Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Revenue Over Time
          </h2>
          {invoices.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${symbol}${value}`} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Appointment Status Breakdown
          </h2>
          {appointmentStatusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {appointmentStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-gray-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Patient Status Breakdown
          </h2>
          {patientStatusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={patientStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {patientStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {patientStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-gray-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Gender Distribution
          </h2>
          {genderData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {genderData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-gray-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Exportable Patient Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Patient Records Summary
          </h2>
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2 text-sm"
            disabled={patients.length === 0}
          >
            <Download size={14} /> Export CSV
          </Button>
        </div>
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">No patient records available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Gender
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Blood Type
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Doctor
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Insurance
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {p.fullName}
                    </td>
                    <td className="px-5 py-3 text-gray-600 capitalize">
                      {p.gender || "N/A"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.bloodType || "N/A"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.assignedDoctor || "N/A"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.insuranceProvider || "N/A"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                          statusColors[p.patientStatus] ||
                            "bg-gray-100 text-gray-500",
                        )}
                      >
                        {p.patientStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[180px]">
      <p className="text-xs text-gray-400">No data available yet.</p>
    </div>
  );
}
