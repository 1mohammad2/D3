import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "D3 Volleyball",
  description: "Professional Volleyball Game Management Platform",
};

// ✅ Only ONE layout.tsx should have <html> and <body> — this one
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale = "en";
  let messages = {};

  try {
    locale = await getLocale();
    messages = await getMessages();
  } catch {
    locale = "en";
    try {
      messages = (await import("../../messages/en.json")).default;
    } catch {
      messages = {};
    }
  }

  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Toaster
          position={isArabic ? "top-left" : "top-right"}
          toastOptions={{
            style: {
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
            },
          }}
        />
      </body>
    </html>
  );
}
