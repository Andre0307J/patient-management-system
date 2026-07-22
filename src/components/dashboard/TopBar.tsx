"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Menu,
  Bell,
  UserPlus,
  CalendarPlus,
  Stethoscope,
  Users,
  CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import AddPatientForm from "./AddPatientsForm";
import AddAppointmentForm from "./AddAppointmentsForm";
import StaffForm from "./StaffForm";
import InvoiceForm from "./InvoiceForm";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePatients } from "@/context/PatientContext";
import Image from "next/image";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const [openPatientModal, setOpenPatientModal] = useState(false);
  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);
  const [openDoctorModal, setOpenDoctorModal] = useState(false);
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    patients,
    staffMembers,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = usePatients();

  useEffect(() => {
    if (!user?.uid) return;
    const loadPhoto = async () => {
      try {
        const hospitalDoc = await getDoc(doc(db, "Hospitals", user.uid));
        if (hospitalDoc.exists() && hospitalDoc.data().photoURL) {
          setAdminPhoto(hospitalDoc.data().photoURL);
        }
      } catch (error) {
        console.error("Error loading admin photo:", error);
      }
    };
    loadPhoto();
  }, [user?.uid]);

  // Page detection
  const isPatientPage = pathname === "/dashboard/patients";
  const isAppointmentPage = pathname === "/dashboard/appointments";
  const isDoctorPage = pathname === "/dashboard/doctors";
  const isStaffPage = pathname === "/dashboard/staff";
  const isBillingPage = pathname === "/dashboard/billing";

  // Search
  const searchResults =
    searchQuery.trim().length > 1
      ? [
          ...patients
            .filter(
              (p) =>
                p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.email.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((p) => ({
              type: "Patient",
              name: p.fullName,
              id: p.id,
              href: "/dashboard/patients",
            })),
          ...staffMembers
            .filter(
              (s) =>
                s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((s) => ({
              type: s.type === "doctor" ? "Doctor" : "Staff",
              name: s.fullName,
              id: s.id,
              href: `/dashboard/${s.type === "doctor" ? "doctors" : "staff"}`,
            })),
        ]
      : [];

  // Avatar
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully.");
      
      // 👇 Swapped out router.replace to guarantee a complete cleanup on sign out
      window.location.href = "/";
      
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
      console.error("Sign out error:", error);
    }
  };

  // Dynamic add button based on current page
  const renderAddButton = () => {
    if (isPatientPage)
      return (
        <Button
          onClick={() => setOpenPatientModal(true)}
          variant="outline"
          className="cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 shadow-none"
        >
          <UserPlus size={16} /> Add New Patient
        </Button>
      );
    if (isAppointmentPage)
      return (
        <Button
          onClick={() => setOpenAppointmentModal(true)}
          variant="outline"
          className="cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 shadow-none"
        >
          <CalendarPlus size={16} /> Add Appointment
        </Button>
      );
    if (isDoctorPage)
      return (
        <Button
          onClick={() => setOpenDoctorModal(true)}
          variant="outline"
          className="cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 shadow-none"
        >
          <Stethoscope size={16} /> Add Doctor
        </Button>
      );
    if (isStaffPage)
      return (
        <Button
          onClick={() => setOpenStaffModal(true)}
          variant="outline"
          className="cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 shadow-none"
        >
          <Users size={16} /> Add Staff Member
        </Button>
      );
    if (isBillingPage)
      return (
        <Button
          onClick={() => setOpenInvoiceModal(true)}
          variant="outline"
          className="cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 shadow-none"
        >
          <CreditCard size={16} /> Create Invoice
        </Button>
      );
    return null;
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        {/* Left — toggle + search */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Menu size={20} />
          </Button>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
            />
            <Input
              type="text"
              placeholder="Search patients, doctors..."
              className="pl-9 w-72 bg-muted border-border"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim().length > 1 && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-card rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition text-left"
                        onClick={() => {
                          router.push(result.href);
                          setSearchQuery("");
                          setShowResults(false);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {result.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.id}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            result.type === "Patient"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : result.type === "Doctor"
                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                          }`}
                        >
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — dynamic add button + notifications + avatar */}
        <div className="flex items-center gap-3">
          {/* Dynamic Add Button */}
          {renderAddButton()}

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer relative p-2 rounded-full hover:bg-gray-100 transition focus:outline-none">
                <Bell size={20} className="text-gray-500" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 font-semibold text-sm text-gray-700 border-b flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className="text-xs text-blue-600 font-normal cursor-pointer hover:underline"
                    onClick={() => markAllAsRead()}
                  >
                    Mark all as read
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">
                  No notifications yet.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${!n.read ? "bg-blue-50" : ""}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === "patient"
                                ? "bg-blue-500"
                                : n.type === "appointment"
                                  ? "bg-purple-500"
                                  : n.type === "staff"
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                            }`}
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-700">
                              {n.message}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}{" "}
                              at{" "}
                              {new Date(n.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-center text-blue-600 text-sm justify-center cursor-pointer"
                    onClick={() => router.push("/dashboard/notifications")}
                  >
                    View All Notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 cursor-pointer h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center hover:opacity-90 transition focus:outline-none overflow-hidden">
                {adminPhoto ? (
                  <Image
                    src={adminPhoto}
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
                  {user?.displayName || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/dashboard/settings")}
              >
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 cursor-pointer"
                onClick={handleSignOut}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Add Patient Modal */}
      <Dialog open={openPatientModal} onOpenChange={setOpenPatientModal}>
        <DialogContent className="w-[90vw] !max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Fill in the patient details below across all steps to create a new
              record.
            </DialogDescription>
          </DialogHeader>
          <AddPatientForm onSuccess={() => setOpenPatientModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Appointment Modal */}
      <Dialog
        open={openAppointmentModal}
        onOpenChange={setOpenAppointmentModal}
      >
        <DialogContent className="w-[90vw] !max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details below to schedule a new appointment.
            </DialogDescription>
          </DialogHeader>
          <AddAppointmentForm
            onSuccess={() => setOpenAppointmentModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Doctor Modal */}
      <Dialog open={openDoctorModal} onOpenChange={setOpenDoctorModal}>
        <DialogContent className="w-[90vw] !max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Doctor</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new doctor.
            </DialogDescription>
          </DialogHeader>
          <StaffForm
            type="doctor"
            onSuccess={() => setOpenDoctorModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Staff Modal */}
      <Dialog open={openStaffModal} onOpenChange={setOpenStaffModal}>
        <DialogContent className="w-[90vw] !max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new staff member.
            </DialogDescription>
          </DialogHeader>
          <StaffForm type="staff" onSuccess={() => setOpenStaffModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Invoice Modal */}
      <Dialog open={openInvoiceModal} onOpenChange={setOpenInvoiceModal}>
        <DialogContent className="w-[90vw] !max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new invoice.
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm onSuccess={() => setOpenInvoiceModal(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}