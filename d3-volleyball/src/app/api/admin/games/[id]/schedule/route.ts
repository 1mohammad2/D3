import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { generateMatchSchedule } from "@/lib/match-scheduler";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET — fetch schedule ───────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  const [matches, game] = await Promise.all([
    db.match.findMany({
      where: { gameId },
      orderBy: [{ round: "asc" }, { court: "asc" }],
      include: {
        homeTeam: { select: { id: true, name: true, number: true } },
        awayTeam: { select: { id: true, name: true, number: true } },
      },
    }),
    db.game.findUnique({
      where: { id: gameId },
      select: { schedulePublished: true },
    }),
  ]);

  return NextResponse.json({
    matches,
    schedulePublished: game?.schedulePublished ?? false,
  });
}

// ── POST — generate schedule ───────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  const teams = await db.team.findMany({
    where: { gameId, isPublished: true },
    select: { id: true, name: true },
    orderBy: { number: "asc" },
  });

  if (teams.length < 2) {
    return NextResponse.json(
      { error: "Publish at least 2 teams before generating schedule" },
      { status: 400 }
    );
  }

  const scheduled = generateMatchSchedule(teams.map((t) => t.id));

  await db.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { gameId, isCompleted: false } });
    await tx.match.createMany({
      data: scheduled.map((m) => ({
        gameId,
        round: m.round,
        court: m.court,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
      })),
    });
  });

  return NextResponse.json({
    message: `Generated ${scheduled.length} matches for ${teams.length} teams`,
    matchCount: scheduled.length,
  });
}

// ── PATCH — save result or publish ────────────────────────────
const resultSchema = z.object({
  action: z.literal("result"),
  matchId: z.string(),
  winnerId: z.string(),
});

const publishSchema = z.object({
  action: z.literal("publish"),
});

const patchSchema = z.discriminatedUnion("action", [resultSchema, publishSchema]);

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.action === "result") {
    const { matchId, winnerId } = parsed.data;

    const match = await db.match.findFirst({
      where: { id: matchId, gameId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    await db.$transaction([
      db.match.update({
        where: { id: matchId },
        data: {
          winnerId,
          isCompleted: true,
          homeScore: winnerId === match.homeTeamId ? 1 : 0,
          awayScore: winnerId === match.awayTeamId ? 1 : 0,
        },
      }),
      db.team.update({
        where: { id: winnerId },
        data: { wins: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ message: "Result saved ✅" });
  }

  // Publish schedule
  await db.game.update({
    where: { id: gameId },
    data: { schedulePublished: true },
  });

  return NextResponse.json({ message: "Schedule published! Players can now see it." });
}