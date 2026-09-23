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
  const [balance, setBalance] = useState(existing?.balance?.toString() ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Balance field is only active when status is partially_paid
  const isPartiallyPaid = paymentStatus === "partially_paid";

  // Auto-change status to "Paid" when balance reaches 0
  const handleBalanceChange = (val: string) => {
    setBalance(val);

    const balanceNum = Number(val);
    const amountNum = Number(amount);

    if (val.trim() !== "" && balanceNum === 0) {
      // Balance fully cleared — mark as paid
      setPaymentStatus("paid");
      setBalance("");
      toast.info("Balance cleared — status updated to Paid.");
    } else if (val.trim() !== "" && amountNum > 0 && balanceNum >= amountNum) {
      // Balance equals or exceeds total — means nothing has been paid yet
      // Keep as partially_paid, no auto-change
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patientId = "Please select a patient.";
    if (!service.trim()) newErrors.service = "Service description is required.";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = "Please enter a valid amount.";
    if (!date) newErrors.date = "Date is required.";

    // Validate balance when partially paid
    if (paymentStatus === "partially_paid") {
      if (!balance || isNaN(Number(balance)))
        newErrors.balance = "Please enter a valid balance.";
      if (Number(balance) > Number(amount))
        newErrors.balance = "Balance cannot exceed the total amount.";
      if (Number(balance) < 0)
        newErrors.balance = "Balance cannot be negative.";
    }

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
          balance: paymentStatus === "partially_paid" ? Number(balance) : 0,
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
          balance: paymentStatus === "partially_paid" ? Number(balance) : 0,
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
      {/* Patient */}
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

      {/* Service */}
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

      {/* Amount + Date */}
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
              // If partially paid, update balance to match new amount
              if (paymentStatus === "partially_paid" && balance === amount) {
                setBalance(e.target.value);
              }
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

      {/* Payment Status + Method */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Payment Status</Label>
          <Select
            value={paymentStatus}
            onValueChange={(val) => {
              const newStatus = val as Invoice["paymentStatus"];
              setPaymentStatus(newStatus);

              if (newStatus === "partially_paid") {
                // Pre-fill balance with full amount if not already set
                if (!balance && amount) {
                  setBalance(amount);
                }
              } else {
                // Clear balance when switching away from partially_paid
                setBalance("");
              }
            }}
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

      {/* Balance — only active when Partially Paid */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label
            className={
              isPartiallyPaid ? "text-foreground" : "text-muted-foreground"
            }
          >
            Balance Remaining ({code})
          </Label>
          {isPartiallyPaid && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Set to 0 to mark as fully paid
            </span>
          )}
        </div>
        <Input
          type="number"
          placeholder="0.00"
          value={balance}
          disabled={!isPartiallyPaid}
          onChange={(e) => handleBalanceChange(e.target.value)}
          className={
            !isPartiallyPaid
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : errors.balance
                ? "border-red-400"
                : "border-amber-400 focus-visible:ring-amber-400"
          }
        />
        {!isPartiallyPaid && (
          <p className="text-xs text-muted-foreground">
            Activates when payment status is set to &quot;Partially Paid&quot;.
          </p>
        )}
        {errors.balance && (
          <p className="text-red-500 text-xs">{errors.balance}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        {existing ? "Save Changes" : "Create Invoice"}
      </Button>
    </form>
  );
}
