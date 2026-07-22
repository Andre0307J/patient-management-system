"use client";

import { useMemo } from "react";
import { usePatients } from "@/context/PatientContext";
import {
  Users,
  UserCheck,
  UserMinus,
  LogOut,
  CalendarDays,
  Stethoscope,
  Activity,
} from "lucide-react";
import * as Recharts from "recharts";

const {
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
  BarChart,
  Bar,
} = Recharts;

export default function DashboardPage() {
  const { patients, appointments, staffMembers, notifications } = usePatients();

  // ─── Stat calculations ─────────────────────────────────────────────
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

  // Appointments today
  const todayStr = new Date().toISOString().split("T")[0];
  const appointmentsToday = appointments.filter(
    (a) => a.date === todayStr,
  ).length;

  // ─── Charts data ───────────────────────────────────────────────────

  // Patient status breakdown
  const statusData = [
    { name: "Active", value: activePatients, color: "#22c55e" },
    { name: "Inactive", value: inactivePatients, color: "#94a3b8" },
    { name: "Discharged", value: dischargedPatients, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Gender distribution
  const genderData = useMemo(() => {
    const male = patients.filter((p) => p.gender === "male").length;
    const female = patients.filter((p) => p.gender === "female").length;
    const other = patients.filter((p) => p.gender === "other").length;
    return [
      { name: "Male", value: male, color: "#3b82f6" },
      { name: "Female", value: female, color: "#ec4899" },
      { name: "Other", value: other, color: "#a855f7" },
    ].filter((d) => d.value > 0);
  }, [patients]);

  // Patients added over time (by month using createdAt)
  const patientsOverTime = useMemo(() => {
    const months: Record<string, number> = {};
    patients.forEach((p) => {
      if (p.createdAt) {
        const date =
          typeof p.createdAt === "string"
            ? new Date(p.createdAt)
            : typeof p.createdAt.toDate === "function"
              ? p.createdAt.toDate()
              : new Date();
        const key = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        months[key] = (months[key] || 0) + 1;
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
        patients: months[key] || 0,
      });
    }
    return result;
  }, [patients]);

  // Appointments this week by day
  const appointmentsData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    // Get start and end of current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    appointments.forEach((a) => {
      const apptDate = new Date(a.date);
      if (apptDate >= startOfWeek && apptDate <= endOfWeek) {
        const dayName = days[apptDate.getDay()];
        counts[dayName] = (counts[dayName] || 0) + 1;
      }
    });

    return days.map((day) => ({ day, appointments: counts[day] }));
  }, [appointments]);

  // Recent activity from notifications
  const recentActivity = useMemo(() => {
    return notifications.slice(0, 5).map((n) => ({
      id: n.id,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
    }));
  }, [notifications]);

  const statCards = [
    {
      label: "Doctors/Staff",
      value: staffMembers.length,
      icon: Stethoscope,
      color: "bg-orange-50 text-orange-500",
    },
    {
      label: "Total Patients",
      value: totalPatients,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Patients",
      value: activePatients,
      icon: UserCheck,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Inactive Patients",
      value: inactivePatients,
      icon: UserMinus,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Discharged",
      value: dischargedPatients,
      icon: LogOut,
      color: "bg-red-50 text-red-500",
    },
    {
      label: "Appointments Today",
      value: appointmentsToday,
      icon: CalendarDays,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const typeColors: Record<string, string> = {
    patient: "bg-blue-500",
    appointment: "bg-purple-500",
    staff: "bg-orange-500",
    billing: "bg-green-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
  {statCards.map((card) => {
    const Icon = card.icon;
    return (
      <div
        key={card.label}
        className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-4 flex flex-col gap-3"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
        </div>
      </div>
    );
  })}
</div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patients Added Over Time */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Patients Added Over Time
          </h2>
          {patients.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={patientsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Appointments This Week */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Appointments This Week
          </h2>
          {appointments.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={appointmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="appointments"
                  fill="#818cf8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Patient Status Donut */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Patient Status Breakdown
          </h2>
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((entry) => (
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

        {/* Gender Distribution Donut */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
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

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Recent Activity
            </h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Activity size={32} className="mb-2" />
              <p className="text-xs text-gray-400">No recent activity yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[activity.type] || "bg-blue-500"}`}
                  />
                  <div>
                    <p className="text-xs text-gray-700">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activity.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}{" "}
                      at{" "}
                      {new Date(activity.createdAt).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[180px] text-gray-300">
      <p className="text-xs text-gray-400">No data available yet.</p>
    </div>
  );
}
