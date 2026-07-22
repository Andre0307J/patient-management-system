"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

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
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo section: */}
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        {collapsed ? (
          <span className="text-blue-600 font-bold text-xl">P</span>
        ) : (
          <span className="text-blue-600 font-bold text-xl tracking-wide">
            PatientCare
          </span>
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
