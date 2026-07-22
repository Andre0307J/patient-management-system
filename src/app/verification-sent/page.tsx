import Header from "@/components/Header";
import VerificationSentPageCard from "@/components/VerificationSentPageCard";

export default function VerificationSentPage() {
  return (
    <main
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/hospital-bg-image.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 -z-10" />

      <Header isVerificationSentPage />

      <div className="flex-1 flex items-center justify-center px-4">
        <VerificationSentPageCard />
      </div>
    </main>
  );
}