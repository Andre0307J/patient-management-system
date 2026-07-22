"use client";

import { useState, useMemo } from "react";
import { usePatients, Appointment } from "@/context/PatientContext";
import {
  CalendarDays,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import EditAppointmentForm from "@/components/dashboard/EditAppointmentsForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function AppointmentsPage() {
  const { appointments, deleteAppointment } = usePatients();
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((a) => a.date === dateStr);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAppointment(deleteTarget.id);
      toast.success("Appointment deleted.", {
        description: `Appointment for ${deleteTarget.patientName} has been removed.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete appointment.", {
        description: "Please check your connection and try again.",
      });
      console.error("Delete appointment error:", error);
    }
  };

  const handleCancelDelete = () => {
    toast.info("Deletion cancelled.", {
      description: "No changes were made to the appointment.",
    });
    setDeleteTarget(null);
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Appointments</h1>
          <p className="text-gray-500 mt-1">
            Schedule and manage patient appointments.
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">{monthName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1 rounded hover:bg-gray-100 transition"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition text-gray-600"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1 rounded hover:bg-gray-100 transition"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-xs font-medium text-gray-400 text-center py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayAppointments = day ? getAppointmentsForDay(day) : [];
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] rounded-lg p-1.5 text-xs",
                  day
                    ? "bg-gray-50 hover:bg-blue-50 transition cursor-default"
                    : "bg-transparent",
                  day && isToday(day) ? "ring-2 ring-blue-500 bg-blue-50" : "",
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "font-medium text-gray-700",
                        isToday(day) && "text-blue-600",
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            "truncate text-[10px] px-1 py-0.5 rounded font-medium",
                            statusColors[apt.status],
                          )}
                        >
                          {apt.patientName}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[10px] text-gray-400 px-1">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            All Appointments
          </h2>
        </div>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarDays size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">No appointments scheduled yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...appointments]
              .sort(
                (a, b) =>
                  new Date(a.date + " " + a.time).getTime() -
                  new Date(b.date + " " + b.time).getTime(),
              )
              .map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {apt.patientName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {apt.doctor} · {apt.date} at {apt.time}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {apt.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                        statusColors[apt.status],
                      )}
                    >
                      {apt.status}
                    </span>
                    <button
                      onClick={() => setEditTarget(apt)}
                      className="p-1.5 rounded hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(apt)}
                      className="p-1.5 rounded hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Edit Appointment Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
          <DialogContent className="w-[90vw] !max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
              <DialogDescription>
                Update the details for {editTarget.patientName}&apos;s
                appointment.
              </DialogDescription>
            </DialogHeader>
            <EditAppointmentForm
              appointment={editTarget}
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
              <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to permanently delete the appointment for{" "}
                <span className="font-semibold text-gray-800">
                  {deleteTarget.patientName}
                </span>{" "}
                with {deleteTarget.doctor} on {deleteTarget.date} at{" "}
                {deleteTarget.time}. This action is irreversible.
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
