import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/home
 * Returns all data needed for the home page:
 * - Next upcoming game with spot counts
 * - Top 5 players for leaderboard preview
 * - Platform stats
 */
export async function GET() {
  try {
    const now = new Date();

    const [nextGame, topPlayers, totalPlayers, totalGames] = await Promise.all([
      // Next upcoming or open game
      db.game.findFirst({
        where: { status: { in: ["UPCOMING", "REGISTRATION_OPEN", "FULL"] }, date: { gte: now } },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          status: true,
          maxPlayers: true,
          registrationOpensAt: true,
          _count: {
            select: {
              registrations: { where: { status: "CONFIRMED" } },
              waitingList: { where: { isPromoted: false } },
            },
          },
        },
      }),

      // Top 5 players by ranking score
      db.user.findMany({
        where: { role: "PLAYER", isApproved: true, isBanned: false },
        orderBy: { rankingScore: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          nickname: true,
          rankingScore: true,
          gamesPlayed: true,
          wins: true,
          skillLevel: true,
          profilePhoto: true,
        },
      }),

      // Total active players
      db.user.count({ where: { role: "PLAYER", isApproved: true, isBanned: false } }),

      // Total completed games
      db.game.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      nextGame: nextGame
        ? {
            ...nextGame,
            confirmedCount: nextGame._count.registrations,
            waitingCount: nextGame._count.waitingList,
            availableSpots: Math.max(0, nextGame.maxPlayers - nextGame._count.registrations),
          }
        : null,
      topPlayers,
      stats: { totalPlayers, totalGames },
    });
  } catch (error) {
    console.error("[HOME_API]", error);
    return NextResponse.json({ error: "Failed to load home data" }, { status: 500 });
  }
}