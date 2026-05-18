import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeGameStatus } from "@/lib/game-utils";

/**
 * GET /api/games/live
 * Returns live spot counts for all upcoming/open games.
 * Lightweight — only the data needed for real-time updates.
 */
export async function GET() {
  const now = new Date();

  const games = await db.game.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      date: { gte: now },
    },
    select: {
      id: true,
      date: true,
      maxPlayers: true,
      registrationOpensAt: true,
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
          waitingList: { where: { isPromoted: false } },
        },
      },
    },
  });

  const result = games.map((game) => ({
    id: game.id,
    confirmedCount: game._count.registrations,
    waitingCount: game._count.waitingList,
    availableSpots: Math.max(0, game.maxPlayers - game._count.registrations),
    status: computeGameStatus(
      game.date,
      game.registrationOpensAt,
      game._count.registrations,
      game.maxPlayers
    ),
  }));

  return NextResponse.json({ games: result });
}