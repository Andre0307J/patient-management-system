"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Patient, ClinicalRecord } from "@/context/PatientContext";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

// 1. Accept clinicalRecords as a prop from the parent
export default function PrintPatientRecord({ 
  patient,
  clinicalRecords = [] 
}: { 
  patient: Patient;
  clinicalRecords?: ClinicalRecord[];
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const { country } = useCurrency();
  const [observations, setObservations] = useState(patient.observations || "");

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Record - ${patient.fullName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 22px; color: #1d4ed8; font-weight: bold; }
            .header p { font-size: 12px; color: #6b7280; margin-top: 2px; }
            .patient-hero { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
            .patient-hero img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
            .patient-hero .avatar-placeholder { width: 80px; height: 80px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #9ca3af; font-weight: bold; }
            .patient-hero h2 { font-size: 18px; font-weight: bold; color: #111827; }
            .patient-hero p { font-size: 12px; color: #6b7280; margin-top: 2px; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: capitalize; margin-top: 4px; }
            .badge.active { background: #dcfce7; color: #16a34a; }
            .badge.inactive { background: #f3f4f6; color: #4b5563; }
            .badge.discharged { background: #fee2e2; color: #dc2626; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .row { display: flex; justify-content: space-between; padding: 5px 8px; font-size: 12px; background: #f9fafb; border-radius: 4px; }
            .row .label { color: #6b7280; }
            .row .value { font-weight: 600; color: #111827; text-transform: capitalize; text-align: right; max-width: 60%; }
            .observations { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-top: 8px; font-size: 12px; color: #92400e; line-height: 1.6; white-space: pre-wrap; }
            
            /* Custom print styling for Clinical Records */
            .clinical-record-card { padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-top: 8px; }
            .clinical-record-header { display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 4px; }
            .clinical-record-type { font-weight: 700; color: #1d4ed8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.025em; }
            .clinical-record-content { font-size: 12px; color: #374151; white-space: pre-wrap; line-height: 1.4; margin-top: 4px; }
            
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Observations textarea — visible in dialog */}
      <div className="space-y-1">
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Enter any observations, symptoms or notes about this patient..."
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <Button onClick={handlePrint} className="gap-2 w-full cursor-pointer" variant="outline">
        <Printer size={15} /> Print Patient Record
      </Button>

      {/* Hidden printable content */}
      <div ref={printRef} style={{ display: "none" }}>
        <div className="header">
          <div>
            <h1>PatientCare</h1>
            <p>Patient Medical Record</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>Date Printed: {today}</p>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>Country: {country}</p>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>Record ID: {patient.id}</p>
          </div>
        </div>

        {/* Patient Hero */}
        <div className="patient-hero">
          {patient.photo ? (
            <Image
              src={patient.photo}
              alt={patient.fullName}
              width={80}
              height={80}
              className="rounded-full object-cover w-[80px] h-[80px]"
              priority
            />
          ) : (
            <div className="avatar-placeholder">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2>{patient.fullName}</h2>
            <p>{patient.id}</p>
            <p>{patient.email} · {patient.phone}</p>
            <span className={`badge ${patient.patientStatus}`}>
              {patient.patientStatus}
            </span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="section">
          <div className="section-title">Basic Information</div>
          <div className="grid">
            <div className="row"><span className="label">Date of Birth</span><span className="value">{patient.dob}</span></div>
            <div className="row"><span className="label">Gender</span><span className="value">{patient.gender}</span></div>
            <div className="row"><span className="label">Nationality</span><span className="value">{patient.nationality || "N/A"}</span></div>
            <div className="row"><span className="label">Blood Type</span><span className="value">{patient.bloodType || "N/A"}</span></div>
            <div className="row" style={{ gridColumn: "span 2" }}><span className="label">Address</span><span className="value">{patient.address}, {patient.city}, {patient.state} {patient.zip}</span></div>
            <div className="row" style={{ gridColumn: "span 2" }}><span className="label">Allergies</span><span className="value">{patient.allergies || "None"}</span></div>
            <div className="row" style={{ gridColumn: "span 2" }}><span className="label">Current Medications</span><span className="value">{patient.medications || "None"}</span></div>
            <div className="row" style={{ gridColumn: "span 2" }}><span className="label">Pre-existing Conditions</span><span className="value">{patient.conditions || "None"}</span></div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="section">
          <div className="section-title">Emergency Contact</div>
          <div className="grid">
            <div className="row"><span className="label">Name</span><span className="value">{patient.emergencyName}</span></div>
            <div className="row"><span className="label">Phone</span><span className="value">{patient.emergencyPhone}</span></div>
            <div className="row" style={{ gridColumn: "span 2" }}><span className="label">Relationship</span><span className="value">{patient.emergencyRelationship}</span></div>
          </div>
        </div>

        {/* Insurance & Admin */}
        <div className="section">
          <div className="section-title">Insurance & Admin</div>
          <div className="grid">
            <div className="row"><span className="label">Insurance Provider</span><span className="value">{patient.insuranceProvider || "N/A"}</span></div>
            <div className="row"><span className="label">Policy Number</span><span className="value">{patient.insurancePolicy || "N/A"}</span></div>
            <div className="row"><span className="label">Assigned Doctor</span><span className="value">{patient.assignedDoctor || "N/A"}</span></div>
            <div className="row"><span className="label">Patient Status</span><span className="value">{patient.patientStatus}</span></div>
          </div>
        </div>

        {/* Observations */}
        {observations && (
          <div className="section">
            <div className="section-title">Observations</div>
            <div className="observations">{observations}</div>
          </div>
        )}

        {/* 2. Safely map through records with styled elements */}
        {clinicalRecords && clinicalRecords.length > 0 && (
          <div className="section">
            <div className="section-title">Clinical Records</div>
            <div>
              {clinicalRecords.map((record) => (
                <div key={record.id} className="clinical-record-card">
                  <div className="clinical-record-header">
                    <span className="clinical-record-type">{record.type}</span>
                    <span>
                      {new Date(record.createdAt).toLocaleDateString()} by {record.addedByName} ({record.addedByRole})
                    </span>
                  </div>
                  <p className="clinical-record-content">{record.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <span>Generated by PatientCare System</span>
          <span>This document is confidential and for medical use only.</span>
        </div>
      </div>
    </div>
  );
}