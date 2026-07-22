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
import { usePatients, Invoice } from "@/context/PatientContext";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";

interface InvoiceFormProps {
  existing?: Invoice;
  onSuccess: () => void;
}

export default function InvoiceForm({ existing, onSuccess }: InvoiceFormProps) {
  const { patients, invoices, addInvoice, updateInvoice } = usePatients();
  const { code } = useCurrency();

  const [patientId, setPatientId] = useState(existing?.patientId ?? "");
  const [service, setService] = useState(existing?.service ?? "");
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? "");
  const [date, setDate] = useState(existing?.date ?? "");
  const [paymentStatus, setPaymentStatus] = useState<Invoice["paymentStatus"]>(
    existing?.paymentStatus ?? "unpaid",
  );
  const [paymentMethod, setPaymentMethod] = useState<Invoice["paymentMethod"]>(
    existing?.paymentMethod ?? "cash",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patientId = "Please select a patient.";
    if (!service.trim()) newErrors.service = "Service description is required.";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = "Please enter a valid amount.";
    if (!date) newErrors.date = "Date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateInvoiceNumber = () => {
    const num = (invoices.length + 1).toString().padStart(4, "0");
    return `INV-${num}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  const selectedPatient = patients.find((p) => p.id === patientId);
  if (!selectedPatient) return;

  try {
    if (existing) {
      await updateInvoice({
        ...existing,
        patientId,
        patientName: selectedPatient.fullName,
        service,
        amount: Number(amount),
        date,
        paymentStatus,
        paymentMethod,
      });
      toast.success("Invoice updated.", {
        description: `Invoice ${existing.invoiceNumber} has been updated.`,
      });
    } else {
      await addInvoice({
        invoiceNumber: generateInvoiceNumber(),
        patientId,
        patientName: selectedPatient.fullName,
        service,
        amount: Number(amount),
        date,
        paymentStatus,
        paymentMethod,
      });
      toast.success("Invoice created.", {
        description: `New invoice for ${selectedPatient.fullName} has been created.`,
      });
    }
    onSuccess();
  } catch (error) {
    toast.error("Failed to save invoice.", {
      description: "Please check your connection and try again.",
    });
    console.error("Invoice form error:", error);
  }
};

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label>Patient</Label>
        <Select
          defaultValue={patientId}
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
        <Label>Service / Treatment Description</Label>
        <Input
          placeholder="e.g. General Consultation, X-Ray, Blood Test"
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            if (e.target.value.trim())
              setErrors((p) => ({ ...p, service: undefined! }));
          }}
        />
        {errors.service && (
          <p className="text-red-500 text-xs">{errors.service}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Amount ({code})</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (Number(e.target.value) > 0)
                setErrors((p) => ({ ...p, amount: undefined! }));
            }}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs">{errors.amount}</p>
          )}
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Payment Status</Label>
          <Select
            defaultValue={paymentStatus}
            onValueChange={(val) =>
              setPaymentStatus(val as Invoice["paymentStatus"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Payment Method</Label>
          <Select
            defaultValue={paymentMethod}
            onValueChange={(val) =>
              setPaymentMethod(val as Invoice["paymentMethod"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {existing ? "Save Changes" : "Create Invoice"}
      </Button>
    </form>
  );
}
