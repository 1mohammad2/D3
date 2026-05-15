import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Middleware runs on EVERY request before the page loads.
 * We use it to protect routes based on authentication state.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Define route categories
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/games");

  // 1. Redirect logged-in users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Redirect non-logged-in users to login
  if (!session && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Block non-admin from admin routes
  if (session && isAdminRoute && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Block unapproved players from protected routes
  if (session && isProtectedRoute && !session.user.isApproved) {
    return NextResponse.redirect(new URL("/pending-approval", req.url));
  }

  return NextResponse.next();
});

// Which routes does middleware run on?
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};