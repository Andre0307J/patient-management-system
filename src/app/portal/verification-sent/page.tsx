import PortalHeader from "@/components/portal/PortalHeader";
import PortalVerificationCard from "@/components/portal/PortalVerificationCard";

export default function PortalVerificationPage() {
  return (
    <main
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/portal-bg-image.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 -z-10" />
      <PortalHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <PortalVerificationCard />
      </div>
    </main>
  );
}
