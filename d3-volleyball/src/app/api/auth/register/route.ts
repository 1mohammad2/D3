import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { registerRateLimit } from "@/lib/rate-limit";
import { tooManyRequests } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  // ✅ Rate limit by IP
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limit = registerRateLimit(ip);

  if (!limit.success) {
    return tooManyRequests(limit.resetAt);
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, nickname, email, phone, password, gender, skillLevel } =
      parsed.data;

    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (phone) {
      const existingPhone = await db.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: "An account with this phone already exists" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        fullName,
        nickname: nickname || null,
        email,
        phone: phone || null,
        password: hashedPassword,
        gender,
        skillLevel,
        isApproved: false,
        role: "PLAYER",
      },
      select: { id: true, fullName: true, email: true },
    });

    return NextResponse.json(
      { message: "Registration submitted! Waiting for admin approval.", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_API]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}