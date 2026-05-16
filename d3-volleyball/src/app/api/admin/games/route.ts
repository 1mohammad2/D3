import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { getRegistrationOpensAt } from "@/lib/game-utils";
import { z } from "zod";

// Validation schema for creating a game
const createGameSchema = z.object({
  date: z.string().min(1, "Game date is required"),
  venue: z.string().optional().default("Main Court"),
  maxPlayers: z.number().min(6).max(100).default(36),
});

// ── GET /api/admin/games — list all games ──────────────────
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const games = await db.game.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
          waitingList: { where: { isPromoted: false } },
          teams: true,
        },
      },
    },
  });

  const gamesWithCounts = games.map((game) => ({
    ...game,
    confirmedCount: game._count.registrations,
    waitingCount: game._count.waitingList,
    teamsCount: game._count.teams,
    availableSpots: Math.max(0, game.maxPlayers - game._count.registrations),
  }));

  return NextResponse.json({ games: gamesWithCounts });
}

// ── POST /api/admin/games — create a game ─────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createGameSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { date, venue, maxPlayers } = parsed.data;
  const gameDate = new Date(date);

  // Validate: game must be in the future
  if (gameDate <= new Date()) {
    return NextResponse.json(
      { error: "Game date must be in the future" },
      { status: 400 }
    );
  }

  // Auto-calculate when registration opens
  const registrationOpensAt = getRegistrationOpensAt(gameDate);

  const game = await db.game.create({
    data: {
      date: gameDate,
      venue,
      maxPlayers,
      status: "UPCOMING",
      registrationOpensAt,
    },
  });

  return NextResponse.json(
    { message: "Game created successfully", game },
    { status: 201 }
  );
}