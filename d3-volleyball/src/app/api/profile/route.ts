import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  fullName: z.string().min(2).max(50).optional(),
  nickname: z.string().max(20).optional(),
  phone: z.string().min(8).max(15).optional(),
});

// ── GET — fetch own profile ────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      email: true,
      phone: true,
      gender: true,
      skillLevel: true,
      profilePhoto: true,
      rankingScore: true,
      rankingPoints: true,
      gamesPlayed: true,
      wins: true,
      losses: true,
      mvpCount: true,
      warningCount: true,
      isBanned: true,
      isApproved: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Recent game registrations
  const recentGames = await db.registration.findMany({
    where: { userId: session.user.id, status: "CONFIRMED" },
    orderBy: { registeredAt: "desc" },
    take: 5,
    select: {
      registeredAt: true,
      attended: true,
      game: {
        select: {
          id: true,
          date: true,
          status: true,
          venue: true,
        },
      },
    },
  });

  // Get rank position among all players
  const rankPosition = await db.user.count({
    where: {
      role: "PLAYER",
      isApproved: true,
      rankingScore: { gt: user.rankingScore },
    },
  });

  const winRate =
    user.gamesPlayed > 0
      ? Math.round((user.wins / user.gamesPlayed) * 100)
      : 0;

  return NextResponse.json({
    user,
    recentGames,
    rankPosition: rankPosition + 1,
    winRate,
  });
}

// ── PATCH — update own profile ─────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.fullName && { fullName: parsed.data.fullName }),
      ...(parsed.data.nickname !== undefined && { nickname: parsed.data.nickname || null }),
      ...(parsed.data.phone && { phone: parsed.data.phone }),
    },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      phone: true,
    },
  });

  return NextResponse.json({
    message: "Profile updated successfully",
    user: updated,
  });
}