"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePortal } from "@/context/PortalContext";
import { signOut } from "firebase/auth";
import { portalAuth as auth } from "@/config/firebase";
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
  const { user } = useAuth();
  const { portalUser, loading } = usePortal();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully.");
      //router.replace("/portal");
      window.location.href = "/portal";
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <span className="text-gray-800 font-semibold">PatientCare</span>
            <span className="text-gray-400 text-xs ml-2">Clinical Portal</span>
          </div>
        </div>

        {/* Right — role badge + avatar */}
        <div className="flex items-center gap-3">
          {portalUser && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
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
              {/* Use this when Firebase Storage has been activated
              <button className="w-9 h-9 rounded-full bg-teal-600 text-white font-semibold text-sm flex items-center justify-center hover:opacity-90 transition focus:outline-none overflow-hidden">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </button> */}
              {/*  Use this when Firebase Storage is not activated */}
              <button className="w-9 h-9 rounded-full bg-teal-600 text-white font-semibold text-sm flex items-center justify-center hover:opacity-90 transition focus:outline-none overflow-hidden">
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
                  <span>{getInitials()}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {portalUser?.fullName || "Loading..."}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
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
      <main className="max-w-6xl mx-auto px-6 py-8">
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
