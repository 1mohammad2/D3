"use client";

// ✅ Client Component — uses hooks instead of async/await
// Works inside BOTH Server Components and Client Components

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageToggle } from "./language-toggle";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Navbar() {
  // ✅ useSession() instead of await auth()
  const { data: session } = useSession();

  // ✅ useLocale() instead of await getLocale()
  const locale = useLocale();

  // ✅ useTranslations() instead of await getTranslations()
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/games", label: t("games") },
    { href: "/leaderboard", label: t("leaderboard") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-black text-white">
              D<span className="text-orange-500">3</span>
            </span>
            <span className="hidden sm:block text-slate-500 text-sm">
              Volleyball
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                {t("admin")}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageToggle currentLocale={locale} />

            {session?.user ? (
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity">
                  {session.user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              </Link>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                <Link href="/login">{tCommon("login")}</Link>
              </Button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-orange-400 hover:bg-slate-800 rounded-lg text-sm font-medium"
              >
                <Shield className="h-4 w-4" />
                {t("admin")}
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}