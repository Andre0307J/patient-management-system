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
import { usePatients } from "@/context/PatientContext";
import { toast } from "sonner";

export default function AddAppointmentForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { patients, appointments, addAppointment } = usePatients();

  const [patientId, setPatientId] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">(
    "scheduled",
  );
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

    // Check for duplicate appointment (same patient, doctor, date and time)
    const isDuplicate = appointments.some(
      (a) =>
        a.patientId === patientId &&
        a.doctor.toLowerCase() === doctor.toLowerCase() &&
        a.date === date &&
        a.time === time,
    );

    if (isDuplicate) {
      toast.error("Duplicate appointment detected.", {
        description:
          "This patient already has an appointment with this doctor at the same date and time.",
      });
      return;
    }

    try {
      await addAppointment({
        patientId,
        patientName: selectedPatient.fullName,
        doctor,
        date,
        time,
        reason,
        status,
      });

      toast.success("Appointment scheduled.", {
        description: `Appointment for ${selectedPatient.fullName} with ${doctor} on ${date} at ${time} has been scheduled.`,
      });

      onSuccess();
    } catch (error) {
      toast.error("Failed to schedule appointment.", {
        description: "Please check your connection and try again",
      });
      console.error("Add appointment error: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label>Patient</Label>
        <Select
          onValueChange={(val) => {
            setPatientId(val);
            setErrors((p) => ({ ...p, patientId: undefined! }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a patient..." />
          </SelectTrigger>
          <SelectContent>
            {patients.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">
                No patients added yet.
              </div>
            ) : (
              patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName} — {p.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.patientId && (
          <p className="text-red-500 text-xs">{errors.patientId}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Doctor</Label>
        <Input
          placeholder="e.g. Dr. Sarah Johnson"
          value={doctor}
          onChange={(e) => {
            setDoctor(e.target.value);
            if (e.target.value.trim())
              setErrors((p) => ({ ...p, doctor: undefined! }));
          }}
        />
        {errors.doctor && (
          <p className="text-red-500 text-xs">{errors.doctor}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value)
                setErrors((p) => ({ ...p, date: undefined! }));
            }}
          />
          {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
        </div>
        <div className="space-y-1">
          <Label>Time</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              if (e.target.value)
                setErrors((p) => ({ ...p, time: undefined! }));
            }}
          />
          {errors.time && <p className="text-red-500 text-xs">{errors.time}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Reason for Visit</Label>
        <Input
          placeholder="e.g. Routine checkup"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (e.target.value.trim())
              setErrors((p) => ({ ...p, reason: undefined! }));
          }}
        />
        {errors.reason && (
          <p className="text-red-500 text-xs">{errors.reason}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          defaultValue="scheduled"
          onValueChange={(val) =>
            setStatus(val as "scheduled" | "completed" | "cancelled")
          }
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
        <Button type="submit" className="w-full">
          Schedule Appointment
        </Button>
      </div>
    </form>
  );
}
