import { auth } from "@/auth";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { LanguageToggle } from "./language-toggle";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">
              D<span className="text-orange-500">3</span>
            </span>
            <span className="hidden sm:block text-slate-500 text-sm">Volleyball</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
              {t("home")}
            </Link>
            <Link href="/games" className="text-slate-400 hover:text-white text-sm transition-colors">
              {t("games")}
            </Link>
            <Link href="/leaderboard" className="text-slate-400 hover:text-white text-sm transition-colors">
              {t("leaderboard")}
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin" className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm transition-colors">
                <Shield className="h-3.5 w-3.5" />
                {t("admin")}
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <LanguageToggle currentLocale={locale} />
            {session?.user ? (
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              </Link>
            ) : (
              <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                <Link href="/login">{tCommon("login")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}