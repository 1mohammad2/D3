import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "D3 Volleyball",
  description: "Professional Volleyball Game Management Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Fix: wrap in try-catch so errors don't crash the whole app
  let locale = "en";
  let messages = {};

  try {
    locale = await getLocale();
    messages = await getMessages();
  } catch (error) {
    console.error("i18n setup error:", error);
    // Fallback to English if i18n fails
    locale = "en";
    try {
      messages = (await import("../../messages/en.json")).default;
    } catch {
      messages = {};
    }
  }

  const isArabic = locale === "ar";

  return (
    <html lang={locale} dir={isArabic ? "rtl" : "ltr"}>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            {children}
          </Providers>
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
