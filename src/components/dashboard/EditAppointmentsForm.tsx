"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatients, Appointment } from "@/context/PatientContext";
import { toast } from "sonner";

export default function EditAppointmentForm({
  appointment,
  onSuccess,
}: {
  appointment: Appointment;
  onSuccess: () => void;
}) {
  const { patients, appointments, updateAppointment } = usePatients();

  const [patientId, setPatientId] = useState(appointment.patientId);
  const [doctor, setDoctor] = useState(appointment.doctor);
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [reason, setReason] = useState(appointment.reason);
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">(appointment.status);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patientId = "Please select a patient.";
    if (!doctor.trim()) newErrors.doctor = "Doctor name is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!time) newErrors.time = "Time is required.";
    if (!reason.trim()) newErrors.reason = "Reason for visit is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  const selectedPatient = patients.find((p) => p.id === patientId);
  if (!selectedPatient) return;

  // Check for duplicate excluding current appointment
  const isDuplicate = appointments.some(
    (a) =>
      a.id !== appointment.id &&
      a.patientId === patientId &&
      a.doctor.toLowerCase() === doctor.toLowerCase() &&
      a.date === date &&
      a.time === time
  );

  if (isDuplicate) {
    toast.error("Duplicate appointment detected.", {
      description: "This patient already has an appointment with this doctor at the same date and time.",
    });
    return;
  }

  try {
    await updateAppointment({
      ...appointment,
      patientId,
      patientName: selectedPatient.fullName,
      doctor,
      date,
      time,
      reason,
      status,
    });

    toast.success("Appointment updated.", {
      description: `Appointment for ${selectedPatient.fullName} has been updated.`,
    });

    onSuccess();
  } catch (error) {
    toast.error("Failed to update appointment.", {
      description: "Please check your connection and try again.",
    });
    console.error("Update appointment error:", error);
  }
};

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label>Patient</Label>
        <Select
          defaultValue={patientId}
          onValueChange={(val) => { setPatientId(val); setErrors((p) => ({ ...p, patientId: undefined! })); }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.fullName} — {p.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.patientId && <p className="text-red-500 text-xs">{errors.patientId}</p>}
      </div>

      <div className="space-y-1">
        <Label>Doctor</Label>
        <Input
          placeholder="e.g. Dr. Sarah Johnson"
          value={doctor}
          onChange={(e) => { setDoctor(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, doctor: undefined! })); }}
        />
        {errors.doctor && <p className="text-red-500 text-xs">{errors.doctor}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); if (e.target.value) setErrors((p) => ({ ...p, date: undefined! })); }}
          />
          {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
        </div>
        <div className="space-y-1">
          <Label>Time</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => { setTime(e.target.value); if (e.target.value) setErrors((p) => ({ ...p, time: undefined! })); }}
          />
          {errors.time && <p className="text-red-500 text-xs">{errors.time}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Reason for Visit</Label>
        <Input
          placeholder="e.g. Routine checkup"
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setErrors((p) => ({ ...p, reason: undefined! })); }}
        />
        {errors.reason && <p className="text-red-500 text-xs">{errors.reason}</p>}
      </div>

      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          defaultValue={status}
          onValueChange={(val) => setStatus(val as "scheduled" | "completed" | "cancelled")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="w-full">Save Changes</Button>
      </div>
    </form>
  );
}