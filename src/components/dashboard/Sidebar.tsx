"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  BriefcaseMedical,
  CreditCard,
  BarChart2,
  Bell,
  Settings,
  KeyRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHospital } from "@/context/HospitalContext";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/dashboard/patients", icon: Users },
  {
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarDays,
  },
  { label: "Doctors", href: "/dashboard/doctors", icon: Stethoscope },
  { label: "Staff", href: "/dashboard/staff", icon: BriefcaseMedical },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart2 },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Portal", href: "/dashboard/portal", icon: KeyRound },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
}

export default function Sidebar({ collapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hospitalName, logoURL } = useHospital();

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo + Close button (mobile) */}
      <div className="h-16 flex items-center justify-between border-b border-border px-4 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {logoURL ? (
              <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0">
                <Image
                  src={logoURL}
                  alt={hospitalName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {hospitalName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-foreground font-bold text-sm tracking-wide truncate">
              {hospitalName}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            {logoURL ? (
              <div className="relative w-8 h-8 rounded-md overflow-hidden">
                <Image
                  src={logoURL}
                  alt={hospitalName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {hospitalName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-accent text-muted-foreground"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center",
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
