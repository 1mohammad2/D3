import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { generateTeams, getTeamBalanceReport } from "@/lib/team-generator";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET — fetch existing teams for a game ──────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  const teams = await db.team.findMany({
    where: { gameId },
    orderBy: { number: "asc" },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              nickname: true,
              skillLevel: true,
              gender: true,
              rankingScore: true,
              profilePhoto: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ teams });
}

// ── POST — generate new teams ──────────────────────────────────
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  // Verify game exists
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { id: true, maxPlayers: true, teamsPublished: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.teamsPublished) {
    return NextResponse.json(
      { error: "Teams are already published. Cannot regenerate." },
      { status: 400 }
    );
  }

  // Get all confirmed registrations for this game
  const registrations = await db.registration.findMany({
    where: { gameId, status: "CONFIRMED" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          skillLevel: true,
          gender: true,
          rankingScore: true,
        },
      },
    },
  });

  if (registrations.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 registered players to generate teams" },
      { status: 400 }
    );
  }

  // Extract player data
  const players = registrations.map((r) => ({
    id: r.user.id,
    fullName: r.user.fullName,
    skillLevel: r.user.skillLevel,
    gender: r.user.gender,
    rankingScore: r.user.rankingScore,
  }));

  // Determine team count based on player count
  const teamCount = Math.min(6, Math.floor(players.length / 3));
  const generatedTeams = generateTeams(players, teamCount);

  // Log balance report for admin visibility
  const balanceReport = getTeamBalanceReport(generatedTeams);
  console.log("[TEAM_GENERATOR] Balance report:", balanceReport);

  // ── Save teams to DB in a single transaction ─────────────────
  await db.$transaction(async (tx) => {
    // Delete existing draft teams (unpublished only)
    await tx.teamMember.deleteMany({
      where: { team: { gameId, isPublished: false } },
    });
    await tx.team.deleteMany({
      where: { gameId, isPublished: false },
    });

    // Create new teams
    for (const teamData of generatedTeams) {
      if (teamData.players.length === 0) continue;

      const team = await tx.team.create({
        data: {
          gameId,
          name: teamData.name,
          number: teamData.number,
          isPublished: false, // Hidden until admin publishes
        },
      });

      // Add members — first player (setter) is captain
      await tx.teamMember.createMany({
        data: teamData.players.map((player, index) => ({
          teamId: team.id,
          userId: player.id,
          isCaptain: index === 0 && player.skillLevel === "SETTER",
        })),
      });
    }
  });

  return NextResponse.json({
    message: `${generatedTeams.length} teams generated successfully`,
    teamCount: generatedTeams.length,
    playerCount: players.length,
    balanceReport,
  });
}

// ── PATCH — publish teams ──────────────────────────────────────
export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  const teamCount = await db.team.count({ where: { gameId } });

  if (teamCount === 0) {
    return NextResponse.json(
      { error: "No teams to publish. Generate teams first." },
      { status: 400 }
    );
  }

  // Publish all teams and mark game as teams-published
  await db.$transaction([
    db.team.updateMany({
      where: { gameId },
      data: { isPublished: true },
    }),
    db.game.update({
      where: { id: gameId },
      data: { teamsPublished: true },
    }),
  ]);

  return NextResponse.json({ message: "Teams published! Players can now see their teams." });
}