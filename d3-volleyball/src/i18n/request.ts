import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Read locale from cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  // Validate — only allow supported locales
  const validLocales = ["en", "ar"] as const;
  const locale = validLocales.includes(cookieLocale as "en" | "ar")
    ? (cookieLocale as "en" | "ar")
    : "en";

  // ✅ Fix: explicit imports instead of dynamic template literal
  // Template literals can fail with Turbopack
  let messages;
  if (locale === "ar") {
    messages = (await import("../../messages/ar.json")).default;
  } else {
    messages = (await import("../../messages/en.json")).default;
  }

  return {
    locale,
    messages,
  };
});