import type { Metadata } from "next";
import PortalAuthGuard from "@/components/PortalAuthGuard"; // Adjust path if placed elsewhere

export const metadata: Metadata = {
  title: "PatientCare Portal",
  description: "Doctor & Nurse Clinical Portal",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalAuthGuard>{children}</PortalAuthGuard>;
}