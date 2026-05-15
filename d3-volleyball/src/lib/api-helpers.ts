import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Reusable helper: checks if the current request is from an authenticated Admin.
 * Use this at the top of every admin API route.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden — Admins only" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}