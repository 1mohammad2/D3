import { hash } from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  name: z.string().min(3).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8).max(20).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'SETTER']),
  setterStatus: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parseResult = registerSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid registration payload.', details: parseResult.error.format() }, { status: 422 });
  }

  const { name, email, password, phone, gender, skillLevel, setterStatus = false } = parseResult.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'Email is already registered.' }, { status: 409 });
  }

  const hashedPassword = await hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      skillLevel,
      setterStatus,
      approved: false,
      role: 'PLAYER'
    }
  });

  return NextResponse.json({ message: 'Registration submitted. Awaiting admin approval.' }, { status: 201 });
}
