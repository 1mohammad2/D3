import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateWinRate } from "@/lib/ranking";

// Keep API safe from expensive/unbounded queries.
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawSkill = searchParams.get("skill");
  const limitParam = searchParams.get("limit");

  const limitNum = Number.parseInt(limitParam ?? String(DEFAULT_LIMIT), 10);
  const limit = Number.isFinite(limitNum)
    ? Math.min(Math.max(limitNum, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  // Validate/whitelist skill values.
  // This must match the Prisma enum type for `User.skillLevel`.
  // If the frontend sends "ALL", skip the filter.
  const allowedSkills = new Set([
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED",
    "SETTER",
  ]);

  const skillFilter =
    rawSkill && rawSkill !== "ALL" && allowedSkills.has(rawSkill)
      ? rawSkill
      : undefined;

  const where = {
    role: "PLAYER" as const,
    isApproved: true,
    isBanned: false,
    ...(skillFilter
  ? { skillLevel: skillFilter as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "SETTER" }
  : {}),
  };


  const players = await db.user.findMany({
    where,
    orderBy: [
      { rankingScore: "desc" },
      { gamesPlayed: "desc" },
      { wins: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      fullName: true,
      nickname: true,
      skillLevel: true,
      gender: true,
      rankingScore: true,
      rankingPoints: true,
      gamesPlayed: true,
      wins: true,
      losses: true,
      mvpCount: true,
      profilePhoto: true,
    },
  });

  // Add computed fields
  const ranked = players.map((player, index) => ({
    ...player,
    rank: index + 1,
    winRate: calculateWinRate(player.wins, player.gamesPlayed),
  }));

  // Platform totals for stats bar
  const totals = await db.game.count({ where: { status: "COMPLETED" } });

  return NextResponse.json({
    players: ranked,
    totalGames: totals,
  });
}