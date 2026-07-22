"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { usePatients } from "@/context/PatientContext";
import { Loader2 } from "lucide-react";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { loading } = usePatients();
  const { user } = useAuth();

  const isUnverified = user && !user.emailVerified;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onToggleSidebar={() => setCollapsed((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {isUnverified ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl max-w-md">
                <h2 className="text-lg font-semibold text-yellow-800">Email Verification Required</h2>
                <p className="text-sm text-yellow-700 mt-2">
                  Your account is not yet verified. Please check your inbox ({user?.email}) 
                  for a verification link to access the dashboard.
                </p>
                <Button className="mt-4 w-full" variant="outline" onClick={() => window.location.reload()}>
                  I&apos;ve verified, refresh page
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}