/**
 * D3 Match Scheduler
 * Uses the "Circle Method" round-robin algorithm.
 *
 * For 6 teams → 5 rounds × 3 matches = 15 total matches
 * Each round is split across Court 1 and Court 2.
 */

export type ScheduledMatch = {
  round: number;
  court: 1 | 2;
  homeTeamId: string;
  awayTeamId: string;
};

export type TeamStanding = {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
};

// ── Main scheduler ─────────────────────────────────────────────
export function generateMatchSchedule(teamIds: string[]): ScheduledMatch[] {
  if (teamIds.length < 2) return [];

  const teams = [...teamIds];

  // Add BYE for odd number of teams
  if (teams.length % 2 !== 0) teams.push("BYE");

  const total = teams.length;
  const rounds = total - 1;
  const perRound = total / 2;
  const result: ScheduledMatch[] = [];
  let block = 1;

  for (let r = 0; r < rounds; r++) {
    const pairs: [string, string][] = [];

    for (let i = 0; i < perRound; i++) {
      const home = teams[i];
      const away = teams[total - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        pairs.push([home, away]);
      }
    }

    // Assign pairs to courts — 2 matches per block
    for (let i = 0; i < pairs.length; i++) {
      if (i > 0 && i % 2 === 0) block++;
      const court = (i % 2 === 0 ? 1 : 2) as 1 | 2;
      result.push({
        round: block,
        court,
        homeTeamId: pairs[i][0],
        awayTeamId: pairs[i][1],
      });
    }

    block++;

    // Rotate: keep index 0 fixed, rotate the rest
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  return result;
}

// ── Calculate live standings ───────────────────────────────────
export function calculateStandings(
  teams: { id: string; name: string }[],
  matches: { homeTeamId: string; awayTeamId: string; winnerId: string | null }[]
): TeamStanding[] {
  const map: Record<string, TeamStanding> = {};

  teams.forEach((t) => {
    map[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
    };
  });

  matches.forEach((m) => {
    if (!m.winnerId) return;
    if (map[m.homeTeamId]) map[m.homeTeamId].played++;
    if (map[m.awayTeamId]) map[m.awayTeamId].played++;

    if (m.winnerId === m.homeTeamId) {
      if (map[m.homeTeamId]) { map[m.homeTeamId].wins++; map[m.homeTeamId].points += 2; }
      if (map[m.awayTeamId]) map[m.awayTeamId].losses++;
    } else {
      if (map[m.awayTeamId]) { map[m.awayTeamId].wins++; map[m.awayTeamId].points += 2; }
      if (map[m.homeTeamId]) map[m.homeTeamId].losses++;
    }
  });

  return Object.values(map).sort((a, b) => b.points - a.points);
}