"use client";

import { usePortalAuth } from "@/hooks/usePortalAuth";
import { usePortal } from "@/context/PortalContext";
import { signOut } from "firebase/auth";
import { portalAuth } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogOut, User } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = usePortalAuth();
  const { portalUser, loading, hospitalName, hospitalLogoURL } = usePortal();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(portalAuth);
      toast.success("Signed out successfully.");
      router.replace("/portal");
    } catch (error) {
      toast.error("Failed to sign out.");
      console.error(error);
    }
  };

  const getInitials = () => {
    if (portalUser?.fullName) {
      return portalUser.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Top Bar */}
      <header className="h-16 bg-white dark:bg-card border-b border-gray-200 dark:border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {hospitalLogoURL ? (
            <div className="relative w-7 h-7 rounded-md overflow-hidden shrink-0">
              <Image
                src={hospitalLogoURL}
                alt={hospitalName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">
                {hospitalName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-800 dark:text-foreground font-semibold text-sm md:text-base">
              {hospitalName}
            </span>
            <span className="text-gray-400 text-xs ml-1 md:ml-2 hidden sm:inline">
              Clinical Portal
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          {portalUser && (
            <span
              className={`text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full font-medium capitalize hidden sm:inline-block ${
                portalUser.role === "doctor"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {portalUser.role}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-teal-600 text-white font-semibold text-sm flex items-center justify-center hover:opacity-90 transition focus:outline-none overflow-hidden">
                {portalUser?.photo ? (
                  <Image
                    src={portalUser.photo}
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs md:text-sm">{getInitials()}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-border">
                <p className="text-sm font-medium text-gray-800 dark:text-foreground truncate">
                  {portalUser?.fullName || "Loading..."}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                {portalUser && (
                  <p className="text-xs text-teal-600 capitalize mt-0.5">
                    {portalUser.role}
                  </p>
                )}
              </div>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => router.push("/portal/dashboard/profile")}
              >
                <User size={14} /> My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 cursor-pointer gap-2"
                onClick={handleSignOut}
              >
                <LogOut size={14} /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
