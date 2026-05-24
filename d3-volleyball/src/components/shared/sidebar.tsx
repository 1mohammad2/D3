"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, Calendar,
  Trophy, Bell, LogOut, Shield, BarChart2, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/players",       label: "Players",       icon: Users },
  { href: "/admin/games",         label: "Games",         icon: Calendar },
  { href: "/admin/teams",         label: "Teams",         icon: Trophy },
  { href: "/admin/analytics",     label: "Analytics",     icon: BarChart2 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar whenever the user navigates to a new page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-orange-500" />
          <span className="text-white font-black text-xl">
            D<span className="text-orange-500">3</span>
          </span>
          <span className="text-slate-400 text-sm ms-1">Admin</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1">
        {adminLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar with hamburger ───────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          <span className="text-white font-black text-lg">
            D<span className="text-orange-500">3</span>
          </span>
          <span className="text-slate-400 text-xs ms-1">Admin</span>
        </div>
      </div>

      {/* ── Backdrop (tap to close) ──────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ───────────────────────────────────── */}
      <aside
        className={cn(
          // Desktop: always visible, static in flow
          "lg:static lg:translate-x-0 lg:flex lg:flex-col lg:w-64 lg:min-h-screen lg:bg-slate-900 lg:border-r lg:border-slate-800",
          // Mobile: fixed overlay, slides in/out
          "fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}