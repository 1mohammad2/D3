import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { computeGameStatus } from "@/lib/game-utils";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // ── Fetch all upcoming/active games ──────────────────
    const games = await db.game.findMany({
      where: {
        status: { not: "CANCELLED" },
        date: { gte: new Date(Date.now() - 1000 * 60 * 60 * 5) },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        venue: true,
        maxPlayers: true,
        status: true,
        registrationOpensAt: true,
        _count: {
          select: {
            registrations: { where: { status: "CONFIRMED" } },
            waitingList: { where: { isPromoted: false } },
          },
        },
      },
    });

    // ── Fetch user's registrations separately (cleaner) ──
    // No conditional Prisma includes — avoids TypeScript issues
    let userRegMap: Record<string, string> = {};
    let userWaitMap: Record<string, number> = {};

    if (userId) {
      const [userRegs, userWaits] = await Promise.all([
        db.registration.findMany({
          where: { userId, status: "CONFIRMED" },
          select: { gameId: true, status: true },
        }),
        db.waitingList.findMany({
          where: { userId, isPromoted: false },
          select: { gameId: true, position: true },
        }),
      ]);

      userRegs.forEach((r) => {
        userRegMap[r.gameId] = r.status;
      });
      userWaits.forEach((w) => {
        userWaitMap[w.gameId] = w.position;
      });
    }

    // ── Build response ────────────────────────────────────
    const result = games.map((game) => {
      const confirmedCount = game._count.registrations;
      const waitingCount = game._count.waitingList;
      const computedStatus = computeGameStatus(
        game.date,
        game.registrationOpensAt,
        confirmedCount,
        game.maxPlayers
      );

      return {
        id: game.id,
        date: game.date,
        venue: game.venue,
        maxPlayers: game.maxPlayers,
        registrationOpensAt: game.registrationOpensAt,
        status: computedStatus,
        confirmedCount,
        waitingCount,
        availableSpots: Math.max(0, game.maxPlayers - confirmedCount),
        userRegistrationStatus: userRegMap[game.id] ?? null,
        userWaitingPosition: userWaitMap[game.id] ?? null,
      };
    });

    return NextResponse.json({ games: result });
  } catch (error) {
    console.error("[GAMES_API]", error);
    return NextResponse.json(
      { error: "Failed to load games" },
      { status: 500 }
    );
  }
}