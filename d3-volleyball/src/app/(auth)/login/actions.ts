"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

type LoginResult = {
  error: "INVALID" | "BANNED" | "PENDING_APPROVAL" | "DB_ERROR" | "UNKNOWN" | null;
};

export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // redirect: false — منمنع NextAuth من عمل redirect تلقائي من السيرفر
    // وبنرجع النتيجة للـ client عشان هو يتحكم بالتنقل + تحديث الجلسة
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { error: null };
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      const causeMessage = (err.cause?.err as Error | undefined)?.message ?? "";

      if (causeMessage === "BANNED") return { error: "BANNED" };
      if (causeMessage === "PENDING_APPROVAL") return { error: "PENDING_APPROVAL" };
      return { error: "INVALID" };
    }

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