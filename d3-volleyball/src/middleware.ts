import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Route protection ─────────────────────────────────────
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/games") ||
    pathname.startsWith("/dashboard");

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!session && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAdminRoute && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (session && isProtectedRoute && !session.user.isApproved) {
    return NextResponse.redirect(new URL("/pending-approval", req.url));
  }

  // ── Security headers ──────────────────────────────────────
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};