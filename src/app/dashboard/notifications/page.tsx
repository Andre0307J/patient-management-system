"use client";

import { usePatients } from "@/context/PatientContext";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  patient: "bg-blue-500",
  appointment: "bg-purple-500",
  staff: "bg-orange-500",
  billing: "bg-green-500",
};

const typeLabels: Record<string, string> = {
  patient: "Patient",
  appointment: "Appointment",
  staff: "Staff",
  billing: "Billing",
};

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = usePatients();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => markAllAsRead()}
          >
            <CheckCheck size={16} /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">No notifications yet.</p>
            <p className="text-xs text-gray-300 mt-1">
              Notifications will appear here when activity occurs.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition",
                  !n.read && "bg-blue-50 hover:bg-blue-50/80"
                )}
              >
                {/* Type indicator dot */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${typeColors[n.type]}`} />

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      n.type === "patient" ? "bg-blue-100 text-blue-700" :
                      n.type === "appointment" ? "bg-purple-100 text-purple-700" :
                      n.type === "staff" ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {typeLabels[n.type]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(n.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Unread indicator */}
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}