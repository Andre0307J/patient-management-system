import PortalHeader from "@/components/portal/PortalHeader";
import PortalForgotPasswordCard from "@/components/portal/PortalForgotPasswordCard";

export default function PortalForgotPasswordPage() {
  return (
    <main
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/portal-bg-image.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-700 to-cyan-500 -z-10" />
      <PortalHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <PortalForgotPasswordCard />
      </div>
    </main>
  );
}