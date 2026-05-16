import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateWinRate } from "@/lib/ranking";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillFilter = searchParams.get("skill"); // optional filter
  const limit = parseInt(searchParams.get("limit") ?? "50");

  // Build where clause
  type WhereClause = {
    role: string;
    isApproved: boolean;
    isBanned: boolean;
    skillLevel?: string;
  };

  const where: WhereClause = {
    role: "PLAYER",
    isApproved: true,
    isBanned: false,
  };

  if (skillFilter && skillFilter !== "ALL") {
    where.skillLevel = skillFilter;
  }

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