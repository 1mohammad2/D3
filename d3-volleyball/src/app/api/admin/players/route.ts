import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

/**
 * GET /api/admin/players
 * Returns all players with their stats, warnings, and ban info.
 * Admin only.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const players = await db.user.findMany({
    where: { role: "PLAYER" },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      email: true,
      phone: true,
      gender: true,
      skillLevel: true,
      isApproved: true,
      isBanned: true,
      warningCount: true,
      rankingScore: true,
      gamesPlayed: true,
      profilePhoto: true,
      createdAt: true,
      // Get active ban details
      bans: {
        where: { isLifted: false, endsAt: { gt: new Date() } },
        select: { reason: true, endsAt: true },
        orderBy: { startsAt: "desc" },
        take: 1,
      },
      // Get active warnings
      warnings: {
        where: { isRemoved: false },
        select: { id: true, reason: true, issuedAt: true },
        orderBy: { issuedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ players });
}
