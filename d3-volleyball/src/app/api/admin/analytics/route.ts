import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Run all queries in parallel for performance
  const [
    totalPlayers,
    approvedPlayers,
    pendingPlayers,
    bannedPlayers,
    totalGames,
    completedGames,
    totalRegistrations,
    cancelledRegistrations,
    totalWaitlist,
    skillDistribution,
    genderDistribution,
    recentGames,
    topPlayers,
    warningCount,
  ] = await Promise.all([
    // Player stats
    db.user.count({ where: { role: "PLAYER" } }),
    db.user.count({ where: { role: "PLAYER", isApproved: true, isBanned: false } }),
    db.user.count({ where: { role: "PLAYER", isApproved: false } }),
    db.user.count({ where: { role: "PLAYER", isBanned: true } }),

    // Game stats
    db.game.count(),
    db.game.count({ where: { status: "COMPLETED" } }),

    // Registration stats
    db.registration.count({ where: { status: "CONFIRMED" } }),
    db.registration.count({ where: { status: "CANCELLED" } }),
    db.waitingList.count(),

    // Skill distribution
    db.user.groupBy({
      by: ["skillLevel"],
      where: { role: "PLAYER", isApproved: true },
      _count: { skillLevel: true },
    }),

    // Gender distribution
    db.user.groupBy({
      by: ["gender"],
      where: { role: "PLAYER", isApproved: true },
      _count: { gender: true },
    }),

    // Recent 6 months of games
    db.game.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        status: true,
        _count: {
          select: {
            registrations: { where: { status: "CONFIRMED" } },
          },
        },
      },
    }),

    // Top 5 players
    db.user.findMany({
      where: { role: "PLAYER", isApproved: true },
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
      },
    }),

    // Active warnings
    db.warning.count({ where: { isRemoved: false } }),
  ]);

  // Calculate attendance rate
  const attendedCount = await db.registration.count({
    where: { attended: true },
  });
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((attendedCount / totalRegistrations) * 100)
      : 0;

  // Calculate cancellation rate
  const cancellationRate =
    totalRegistrations + cancelledRegistrations > 0
      ? Math.round(
          (cancelledRegistrations /
            (totalRegistrations + cancelledRegistrations)) *
            100
        )
      : 0;

  // Group games by month for chart
  const gamesByMonth: Record<string, { month: string; games: number; players: number }> = {};
  recentGames.forEach((game) => {
    const monthKey = new Date(game.date).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    if (!gamesByMonth[monthKey]) {
      gamesByMonth[monthKey] = { month: monthKey, games: 0, players: 0 };
    }
    gamesByMonth[monthKey].games++;
    gamesByMonth[monthKey].players += game._count.registrations;
  });

  return NextResponse.json({
    overview: {
      totalPlayers,
      approvedPlayers,
      pendingPlayers,
      bannedPlayers,
      totalGames,
      completedGames,
      totalRegistrations,
      cancelledRegistrations,
      totalWaitlist,
      attendanceRate,
      cancellationRate,
      activeWarnings: warningCount,
    },
    charts: {
      skillDistribution: skillDistribution.map((s) => ({
        name: s.skillLevel,
        value: s._count.skillLevel,
      })),
      genderDistribution: genderDistribution.map((g) => ({
        name: g.gender,
        value: g._count.gender,
      })),
      gamesByMonth: Object.values(gamesByMonth),
      topPlayers: topPlayers.map((p) => ({
        name: p.nickname ?? p.fullName.split(" ")[0],
        score: p.rankingScore,
        games: p.gamesPlayed,
        wins: p.wins,
        skill: p.skillLevel,
      })),
    },
  });
}