import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const reorderSchema = z.object({
  teams: z.array(
    z.object({
      teamId: z.string(),
      playerIds: z.array(z.string()),
      captainId: z.string().optional(),
    })
  ),
});

/**
 * POST /api/admin/games/[id]/teams/reorder
 * Saves new team composition after drag & drop editing.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;
  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { teams } = parsed.data;

  // Verify game exists and teams are not published
  const teamRecords = await db.team.findMany({
    where: { gameId },
    select: { id: true, isPublished: true },
  });

  const publishedTeam = teamRecords.find((t) => t.isPublished);
  if (publishedTeam) {
    return NextResponse.json(
      { error: "Cannot reorder published teams" },
      { status: 400 }
    );
  }

  // Validate all team IDs belong to this game
  const validTeamIds = new Set(teamRecords.map((t) => t.id));
  for (const team of teams) {
    if (!validTeamIds.has(team.teamId)) {
      return NextResponse.json(
        { error: `Team ${team.teamId} does not belong to this game` },
        { status: 400 }
      );
    }
  }

  // Save new composition in transaction
  await db.$transaction(async (tx) => {
    for (const team of teams) {
      // Remove all current members
      await tx.teamMember.deleteMany({
        where: { teamId: team.teamId },
      });

      // Add new members
      if (team.playerIds.length > 0) {
        await tx.teamMember.createMany({
          data: team.playerIds.map((userId) => ({
            teamId: team.teamId,
            userId,
            isCaptain: userId === team.captainId,
          })),
        });
      }
    }
  });

  return NextResponse.json({
    message: "Team composition saved successfully",
  });
}