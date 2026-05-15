import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate request body
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, nickname, email, phone, password, gender, skillLevel } = parsed.data;

    // 2. Check for duplicate email
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // 3. Check for duplicate phone
    if (phone) {
      const existingPhone = await db.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    // 4. Hash password — NEVER store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create user — isApproved: false (needs admin approval)
    const user = await db.user.create({
      data: {
        fullName,
        nickname: nickname || null,
        email,
        phone: phone || null,
        password: hashedPassword,
        gender,
        skillLevel,
        isApproved: false, // Admin must approve
        role: "PLAYER",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isApproved: true,
      },
    });

    // TODO Phase 16: Send notification to admin about new registration

    return NextResponse.json(
      {
        message: "Registration successful! Please wait for admin approval.",
        user,
      },
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