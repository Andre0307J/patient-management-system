"use client";

import { Invoice } from "@/context/PatientContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Printer } from "lucide-react";

export default function PrintInvoice({ invoice }: { invoice: Invoice }) {
  const { symbol, currency, country } = useCurrency();

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusColors: Record<string, string> = {
    paid: "background:#dcfce7; color:#16a34a;",
    unpaid: "background:#fee2e2; color:#dc2626;",
    partially_paid: "background:#fef9c3; color:#92400e;",
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

  const handlePrint = () => {
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber} - ${invoice.patientName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; padding: 48px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .clinic-name { font-size: 26px; font-weight: bold; color: #1d4ed8; }
            .clinic-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .invoice-label { text-align: right; }
            .invoice-label h2 { font-size: 22px; font-weight: bold; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; }
            .invoice-label p { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .divider { border: none; border-top: 2px solid #1d4ed8; margin: 24px 0; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
            .meta-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
            .meta-box p { font-size: 13px; color: #111827; line-height: 1.6; }
            .meta-box .highlight { font-weight: bold; font-size: 14px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .table thead tr { background: #1d4ed8; color: white; }
            .table thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
            .table tbody tr { border-bottom: 1px solid #e5e7eb; }
            .table tbody td { padding: 12px 14px; font-size: 13px; color: #374151; }
            .table tfoot tr { background: #f9fafb; }
            .table tfoot td { padding: 12px 14px; font-weight: bold; font-size: 14px; }
            .status-badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
            .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
            .notes-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
            .notes-box p { font-size: 12px; color: #6b7280; line-height: 1.6; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
            .footer p { font-size: 11px; color: #9ca3af; }
            .footer .thank-you { font-size: 13px; font-weight: 600; color: #1d4ed8; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-name">PatientCare</div>
              <div class="clinic-sub">Medical Management System</div>
              <div class="clinic-sub">${country}</div>
            </div>
            <div class="invoice-label">
              <h2>Invoice</h2>
              <p>${invoice.invoiceNumber}</p>
              <p>Date: ${invoice.date}</p>
              <p>Printed: ${today}</p>
            </div>
          </div>

          <hr class="divider" />

          <div class="meta">
            <div class="meta-box">
              <h3>Bill To</h3>
              <p class="highlight">${invoice.patientName}</p>
              <p>Patient ID: ${invoice.patientId}</p>
            </div>
            <div class="meta-box" style="text-align: right;">
              <h3>Invoice Details</h3>
              <p>Invoice No: <strong>${invoice.invoiceNumber}</strong></p>
              <p>Date: <strong>${invoice.date}</strong></p>
              <p>Payment Method: <strong>${methodLabels[invoice.paymentMethod]}</strong></p>
              <p style="margin-top: 6px;">
                Status: <span class="status-badge" style="${statusColors[invoice.paymentStatus]}">
                  ${statusLabels[invoice.paymentStatus]}
                </span>
              </p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Service / Treatment Description</th>
                <th>Currency</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${invoice.service}</td>
                <td>${currency}</td>
                <td style="text-align: right;">${symbol}${invoice.amount.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; color: #6b7280;">Total Amount</td>
                <td style="text-align: right; color: #1d4ed8;">${symbol}${invoice.amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="notes-box">
            <h3>Notes</h3>
            <p>Please retain this invoice for your records. For any billing inquiries, contact the hospital administration. This invoice serves as an official receipt of payment for services rendered by PatientCare.</p>
          </div>

          <div class="footer">
            <div>
              <p>Generated by PatientCare System</p>
              <p>This document is confidential and for medical use only.</p>
            </div>
            <div class="thank-you">Thank you for choosing PatientCare!</div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          URL.revokeObjectURL(url);
        };
      };
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="p-1.5 rounded hover:bg-blue-50 transition text-gray-400 hover:text-blue-500"
      title="Print Invoice"
    >
      <Printer size={14} />
    </button>
  );
}
