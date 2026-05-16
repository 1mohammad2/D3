"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Language toggle button — switches between EN and AR.
 * Saves preference to cookie and refreshes the page.
 */
export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLanguage = () => {
    const newLocale = currentLocale === "en" ? "ar" : "en";

    // Save to cookie (expires in 1 year)
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;

    startTransition(() => {
      router.refresh(); // Re-render with new locale
    });
  };

  return (
    <button
      onClick={switchLanguage}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
        border border-slate-700 text-slate-300 text-sm font-medium
        hover:border-orange-500/50 hover:text-orange-400
        transition-all duration-200 disabled:opacity-50"
    >
      <span className="text-base">{currentLocale === "en" ? "🇸🇦" : "🇺🇸"}</span>
      <span>{currentLocale === "en" ? "العربية" : "English"}</span>
    </button>
  );
}