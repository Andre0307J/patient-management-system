"use client";

import { useState, useMemo } from "react";
import { usePatients, Invoice } from "@/context/PatientContext";
import { Pencil, Trash2, CreditCard } from "lucide-react";
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
import InvoiceForm from "@/components/dashboard/InvoiceForm";
import PrintInvoice from "@/components/dashboard/PrintInvoice";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-red-100 text-red-600",
  partially_paid: "bg-yellow-100 text-yellow-700",
};

const statusLabels: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
};

const methodLabels: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  insurance: "Insurance",
};

export default function BillingPage() {
  const { invoices, deleteInvoice } = usePatients();
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { symbol, code } = useCurrency();

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || inv.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  // Summary stats
  const totalRevenue = invoices
    .filter((i) => i.paymentStatus === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid = invoices
    .filter((i) => i.paymentStatus === "unpaid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalPartial = invoices
    .filter((i) => i.paymentStatus === "partially_paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const handleDelete = async () => {
  if (!deleteTarget) return;
  try {
    await deleteInvoice(deleteTarget.id);
    toast.success("Invoice deleted.", {
      description: `Invoice ${deleteTarget.invoiceNumber} has been removed.`,
    });
    setDeleteTarget(null);
  } catch (error) {
    toast.error("Failed to delete invoice.", {
      description: "Please check your connection and try again.",
    });
    console.error("Delete invoice error:", error);
  }
};

  const handleCancelDelete = () => {
    toast.info("Deletion cancelled.", {
      description: "No changes were made.",
    });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Billing</h1>
          <p className="text-gray-500 mt-1">
            Manage patient invoices and payments.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CreditCard size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-gray-800">
              {symbol}
              {totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <CreditCard size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Unpaid</p>
            <p className="text-xl font-bold text-gray-800">
              {symbol}
              {totalUnpaid.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
            <CreditCard size={20} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Partially Paid</p>
            <p className="text-xl font-bold text-gray-800">
              {symbol}
              {totalPartial.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by patient or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 h-9 px-3 text-sm rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially Paid</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">
              {invoices.length === 0
                ? `No invoices created yet. Click "Create Invoice" to get started.`
                : `No invoices match your search.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Invoice
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Patient
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Service
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount ({code})
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Method
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {inv.patientName}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[160px] truncate">
                      {inv.service}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{inv.date}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {symbol}
                      {inv.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-gray-600 capitalize">
                      {methodLabels[inv.paymentMethod]}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          statusColors[inv.paymentStatus],
                        )}
                      >
                        {statusLabels[inv.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <PrintInvoice invoice={inv} />
                        <button
                          onClick={() => setEditTarget(inv)}
                          className="p-1.5 rounded hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(inv)}
                          className="p-1.5 rounded hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Invoice Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
          <DialogContent className="w-[90vw] !max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>
                Update details for {editTarget.invoiceNumber}.
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm
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
              <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to permanently delete invoice{" "}
                <span className="font-semibold text-gray-800">
                  {deleteTarget.invoiceNumber}
                </span>{" "}
                for {deleteTarget.patientName}. This action is irreversible.
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
