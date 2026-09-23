"use client";

import { useState } from "react";
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
import { useHospital } from "@/context/HospitalContext";
import Image from "next/image";

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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const router = useRouter();
  const { hospitalName, logoURL } = useHospital();
  const pathname = usePathname();
  const { user } = useAuth();
  const { patients, staffMembers, notifications, unreadCount, markAllAsRead } =
    usePatients();

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
                p.fullName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                s.fullName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                s.id.toLowerCase().includes(searchQuery.toLowerCase())
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
      router.replace("/admin");
    } catch (error) {
      toast.error("Failed to sign out.");
      console.error("Sign out error:", error);
    }
  };

  const renderAddButton = () => {
    if (isPatientPage)
      return (
        <Button
          onClick={() => setOpenPatientModal(true)}
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 gap-1.5 shadow-none text-xs md:text-sm"
        >
          <UserPlus size={14} />
          <span className="hidden sm:inline">Add New Patient</span>
          <span className="sm:hidden">Add</span>
        </Button>
      );
    if (isAppointmentPage)
      return (
        <Button
          onClick={() => setOpenAppointmentModal(true)}
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 gap-1.5 shadow-none text-xs md:text-sm"
        >
          <CalendarPlus size={14} />
          <span className="hidden sm:inline">Add Appointment</span>
          <span className="sm:hidden">Add</span>
        </Button>
      );
    if (isDoctorPage)
      return (
        <Button
          onClick={() => setOpenDoctorModal(true)}
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 gap-1.5 shadow-none text-xs md:text-sm"
        >
          <Stethoscope size={14} />
          <span className="hidden sm:inline">Add Doctor</span>
          <span className="sm:hidden">Add</span>
        </Button>
      );
    if (isStaffPage)
      return (
        <Button
          onClick={() => setOpenStaffModal(true)}
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 gap-1.5 shadow-none text-xs md:text-sm"
        >
          <Users size={14} />
          <span className="hidden sm:inline">Add Staff Member</span>
          <span className="sm:hidden">Add</span>
        </Button>
      );
    if (isBillingPage)
      return (
        <Button
          onClick={() => setOpenInvoiceModal(true)}
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 gap-1.5 shadow-none text-xs md:text-sm"
        >
          <CreditCard size={14} />
          <span className="hidden sm:inline">Create Invoice</span>
          <span className="sm:hidden">Add</span>
        </Button>
      );
    return null;
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-3 md:px-6 shrink-0 gap-2">
        {/* Left — toggle + search */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Menu size={20} />
          </Button>

          {/* Desktop search */}
          <div className="relative hidden md:block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
            />
            <Input
              type="text"
              placeholder="Search patients, doctors..."
              className="pl-9 w-56 lg:w-72 bg-muted border-border"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
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

          {/* Mobile search button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
            onClick={() => setShowMobileSearch(true)}
          >
            <Search size={18} />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {renderAddButton()}

          {/* Notification Bell */}
          <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-accent transition focus:outline-none">
                <Bell size={18} className="text-muted-foreground" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 md:w-80">
              <div className="px-3 py-2 font-semibold text-sm text-foreground border-b border-border flex items-center justify-between">
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
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No notifications yet.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border max-h-72 overflow-y-auto">
                    {notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${
                          !n.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                        }`}
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
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-foreground line-clamp-2">
                              {n.message}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}{" "}
                              at{" "}
                              {new Date(n.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
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
              <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center hover:opacity-90 transition focus:outline-none overflow-hidden shrink-0">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs md:text-sm">{getInitials()}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-3 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  {logoURL ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                      <Image
                        src={logoURL}
                        alt={hospitalName}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">
                        {hospitalName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Hospital</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {hospitalName}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.displayName || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
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

      {/* Mobile Search Modal */}
      <Dialog open={showMobileSearch} onOpenChange={setShowMobileSearch}>
        <DialogContent className="w-[95vw] max-w-md top-4 translate-y-0 sm:top-[50%] sm:-translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search patients, doctors and staff
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
            />
            <Input
              type="text"
              placeholder="Search patients, doctors..."
              className="pl-9 bg-muted border-border"
              value={searchQuery}
              autoFocus
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
            />
          </div>
          {searchQuery.trim().length > 1 && (
            <div className="divide-y divide-border max-h-64 overflow-y-auto rounded-lg border border-border">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition text-left"
                    onClick={() => {
                      router.push(result.href);
                      setSearchQuery("");
                      setShowMobileSearch(false);
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
                          ? "bg-blue-100 text-blue-700"
                          : result.type === "Doctor"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {result.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <Dialog open={openPatientModal} onOpenChange={setOpenPatientModal}>
        <DialogContent className="w-[95vw] !max-w-2xl max-h-[90vh] overflow-y-auto">
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

      <Dialog
        open={openAppointmentModal}
        onOpenChange={setOpenAppointmentModal}
      >
        <DialogContent className="w-[95vw] !max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details below to schedule a new appointment.
            </DialogDescription>
          </DialogHeader>
          <AddAppointmentForm onSuccess={() => setOpenAppointmentModal(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={openDoctorModal} onOpenChange={setOpenDoctorModal}>
        <DialogContent className="w-[95vw] !max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Doctor</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new doctor.
            </DialogDescription>
          </DialogHeader>
          <StaffForm type="doctor" onSuccess={() => setOpenDoctorModal(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={openStaffModal} onOpenChange={setOpenStaffModal}>
        <DialogContent className="w-[95vw] !max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new staff member.
            </DialogDescription>
          </DialogHeader>
          <StaffForm type="staff" onSuccess={() => setOpenStaffModal(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={openInvoiceModal} onOpenChange={setOpenInvoiceModal}>
        <DialogContent className="w-[95vw] !max-w-lg max-h-[90vh] overflow-y-auto">
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