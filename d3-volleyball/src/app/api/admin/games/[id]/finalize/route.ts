import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { calculateRankingScore } from "@/lib/ranking";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const finalizeSchema = z.object({
  winningTeamId: z.string().min(1, "Winning team is required"),
});

/**
 * POST /api/admin/games/[id]/finalize
 *
 * What this does:
 * 1. Validates the winning team belongs to this game
 * 2. Awards +1 rankingPoint to all winning team players
 * 3. Increments gamesPlayed for ALL registered players
 * 4. Increments wins for winning team players
 * 5. Increments losses for other players
 * 6. Recalculates rankingScore for all affected players
 * 7. Marks game as COMPLETED
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  const body = await req.json();
  const parsed = finalizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { winningTeamId } = parsed.data;

  // Verify game exists and is not already completed
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { id: true, status: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Game is already finalized" },
      { status: 400 }
    );
  }

  // Verify winning team belongs to this game
  const winningTeam = await db.team.findFirst({
    where: { id: winningTeamId, gameId },
    include: {
      members: { select: { userId: true } },
    },
  });

  if (!winningTeam) {
    return NextResponse.json(
      { error: "Winning team not found in this game" },
      { status: 404 }
    );
  }

  // Get ALL confirmed registrations for this game
  const allRegistrations = await db.registration.findMany({
    where: { gameId, status: "CONFIRMED" },
    select: { userId: true },
  });

  const allPlayerIds = allRegistrations.map((r) => r.userId);
  const winningPlayerIds = winningTeam.members.map((m) => m.userId);
  const losingPlayerIds = allPlayerIds.filter(
    (id) => !winningPlayerIds.includes(id)
  );

  // ── Update all scores in a single transaction ──────────────
  await db.$transaction(async (tx) => {
    // 1. Winning team players: +1 point, +1 win, +1 gamesPlayed
    for (const userId of winningPlayerIds) {
      const player = await tx.user.findUnique({
        where: { id: userId },
        select: { rankingPoints: true, gamesPlayed: true, wins: true },
      });

      if (!player) continue;

      const newPoints = player.rankingPoints + 1;
      const newGames = player.gamesPlayed + 1;
      const newWins = player.wins + 1;

      await tx.user.update({
        where: { id: userId },
        data: {
          rankingPoints: newPoints,
          gamesPlayed: newGames,
          wins: newWins,
          rankingScore: calculateRankingScore(newPoints, newGames),
        },
      });
    }

    // 2. Losing team players: +1 loss, +1 gamesPlayed (no points)
    for (const userId of losingPlayerIds) {
      const player = await tx.user.findUnique({
        where: { id: userId },
        select: { rankingPoints: true, gamesPlayed: true, losses: true },
      });

      if (!player) continue;

      const newGames = player.gamesPlayed + 1;
      const newLosses = player.losses + 1;

      await tx.user.update({
        where: { id: userId },
        data: {
          gamesPlayed: newGames,
          losses: newLosses,
          rankingScore: calculateRankingScore(player.rankingPoints, newGames),
        },
      });
    }

    // 3. Update winning team record
    await tx.team.update({
      where: { id: winningTeamId },
      data: { wins: { increment: 1 } },
    });

    // 4. Mark game as COMPLETED
    await tx.game.update({
      where: { id: gameId },
      data: { status: "COMPLETED" },
    });

    // 5. Mark all players as attended
    await tx.registration.updateMany({
      where: { gameId, status: "CONFIRMED" },
      data: { attended: true },
    });

    // 6. Notify winning team players
    await tx.notification.createMany({
      data: winningPlayerIds.map((userId) => ({
        userId,
        type: "TEAMS_PUBLISHED" as const,
        title: "🏆 Your team won!",
        message: `Congratulations! Your team won this game. +1 ranking point added!`,
        data: { gameId },
      })),
    });
  });

  return NextResponse.json({
    message: "Game finalized! Scores updated for all players.",
    winnerCount: winningPlayerIds.length,
    totalPlayers: allPlayerIds.length,
  });
}