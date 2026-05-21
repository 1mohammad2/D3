"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

type LoginResult = {
  error: "INVALID" | "BANNED" | "PENDING_APPROVAL" | "DB_ERROR" | "UNKNOWN" | null;
};

export async function loginAction(
  email: string,
  password: string,
  callbackUrl: string
): Promise<LoginResult> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });

    return { error: null };
  } catch (err: unknown) {
    // Next.js throws a special redirect error on successful login.
    // We MUST re-throw it — it is not an error, it IS the success.
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" ||
        (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }

    // NextAuth wraps authorize() errors inside AuthError
    if (err instanceof AuthError) {
      const causeMessage = (err.cause?.err as Error | undefined)?.message ?? "";

      if (causeMessage === "BANNED") return { error: "BANNED" };
      if (causeMessage === "PENDING_APPROVAL") return { error: "PENDING_APPROVAL" };
      return { error: "INVALID" };
    }

    // Database connection failure
    const error = err as { message?: string };
    if (
      error?.message?.includes("Can't reach database") ||
      error?.message?.includes("connect ECONNREFUSED") ||
      error?.message?.includes("PrismaClientInitializationError")
    ) {
      console.error("[LOGIN] Database unreachable:", error.message);
      return { error: "DB_ERROR" };
    }

    console.error("[LOGIN_ACTION] Unexpected error:", err);
    return { error: "UNKNOWN" };
  }
}