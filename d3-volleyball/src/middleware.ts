import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Middleware for route protection.
 * Note: We do NOT use next-intl middleware to avoid the deprecation warning.
 * Locale is handled via cookies in src/i18n/request.ts instead.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/games");

  // 1. Logged-in users → away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Non-logged-in → to login
  if (!session && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Non-admin → blocked from /admin
  if (session && isAdminRoute && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Unapproved players → pending page
  if (session && isProtectedRoute && !session.user.isApproved) {
    return NextResponse.redirect(new URL("/pending-approval", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};