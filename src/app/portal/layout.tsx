import type { Metadata } from "next";
import PortalAuthGuard from "@/components/PortalAuthGuard"; // Adjust path if placed elsewhere

export const metadata: Metadata = {
  title: "PatientCare Portal",
  description: "Doctor & Nurse Clinical Portal",
  icons: {
    icon: {
      url: "/pms-image.png",
      sizes: "any",
      type: "image/png",
    },
    shortcut: "/pms-image.png",
    apple: "/pms-image.png",
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalAuthGuard>{children}</PortalAuthGuard>;
}