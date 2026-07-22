import DashboardShell from "@/components/dashboard/DashboardShell";
import AuthGuard from "@/components/AuthGuard";
import { PortalProvider } from "@/context/PortalContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PortalProvider>
        <DashboardShell>{children}</DashboardShell>
      </PortalProvider>
    </AuthGuard>
  );
}
