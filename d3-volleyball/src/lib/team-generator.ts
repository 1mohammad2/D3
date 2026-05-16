/**
 * D3 Team Generation Algorithm
 *
 * Strategy: Snake Draft with Skill Balancing
 *
 * Round 1: Teams 0,1,2,3,4,5 each pick one player
 * Round 2: Teams 5,4,3,2,1,0 each pick one player (reversed)
 * Round 3: Teams 0,1,2,3,4,5 again...
 *
 * This ensures teams get balanced skill levels automatically.
 * Setters are distributed first before the draft starts.
 */

// ── Types ──────────────────────────────────────────────────────
type PlayerInput = {
  id: string;
  fullName: string;
  skillLevel: string;
  gender: string;
  rankingScore: number;
};

type TeamOutput = {
  name: string;
  number: number;
  players: PlayerInput[];
};

// ── Skill score for sorting ────────────────────────────────────
const SKILL_SCORE: Record<string, number> = {
  SETTER: 4,
  ADVANCED: 3,
  INTERMEDIATE: 2,
  BEGINNER: 1,
};

// ── Shuffle array randomly ─────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Snake Draft: assign players to teams in snake order ────────
function snakeDraft(players: PlayerInput[], teamCount: number): PlayerInput[][] {
  const teams: PlayerInput[][] = Array.from({ length: teamCount }, () => []);

  players.forEach((player, index) => {
    const round = Math.floor(index / teamCount);
    const posInRound = index % teamCount;
    // Even rounds: left to right, Odd rounds: right to left
    const teamIndex = round % 2 === 0
      ? posInRound
      : teamCount - 1 - posInRound;
    teams[teamIndex].push(player);
  });

  return teams;
}

// ── Main Algorithm ─────────────────────────────────────────────
export function generateTeams(
  players: PlayerInput[],
  teamCount: number = 6
): TeamOutput[] {
  if (players.length === 0) return [];

  // ── Step 1: Separate setters from other players ──────────────
  const setters = players.filter((p) => p.skillLevel === "SETTER");
  const nonSetters = players.filter((p) => p.skillLevel !== "SETTER");

  // ── Step 2: Sort non-setters by skill (high → low) ──────────
  // Add slight randomness within same skill tier for variety
  const sortedPlayers = [...nonSetters].sort((a, b) => {
    const skillDiff = SKILL_SCORE[b.skillLevel] - SKILL_SCORE[a.skillLevel];
    if (skillDiff !== 0) return skillDiff;
    // Same skill: sort by ranking with small random factor
    return (b.rankingScore - a.rankingScore) + (Math.random() * 2 - 1);
  });

  // ── Step 3: Gender-interleave for better distribution ────────
  // Alternate Male/Female in sorted list when possible
  const males = sortedPlayers.filter((p) => p.gender === "MALE");
  const females = sortedPlayers.filter((p) => p.gender === "FEMALE");
  const interleaved: PlayerInput[] = [];

  let mi = 0;
  let fi = 0;
  let turn: "M" | "F" = "M";

  while (mi < males.length || fi < females.length) {
    if (turn === "M" && mi < males.length) {
      interleaved.push(males[mi++]);
      turn = "F";
    } else if (fi < females.length) {
      interleaved.push(females[fi++]);
      turn = "M";
    } else {
      interleaved.push(males[mi++]);
    }
  }

  // ── Step 4: Snake draft the non-setters ─────────────────────
  const draftedTeams = snakeDraft(interleaved, teamCount);

  // ── Step 5: Distribute setters to teams ─────────────────────
  // Shuffle setters for randomness, then assign one per team
  const shuffledSetters = shuffle(setters);
  shuffledSetters.forEach((setter, i) => {
    draftedTeams[i % teamCount].unshift(setter); // setters go first (captains)
  });

  // ── Step 6: Build final output ───────────────────────────────
  return draftedTeams.map((teamPlayers, i) => ({
    name: `Team ${i + 1}`,
    number: i + 1,
    players: teamPlayers,
  }));
}

// ── Check balance quality (for debugging/logging) ──────────────
export function getTeamBalanceReport(teams: TeamOutput[]) {
  return teams.map((team) => {
    const avgSkill =
      team.players.reduce((sum, p) => sum + (SKILL_SCORE[p.skillLevel] ?? 1), 0) /
      (team.players.length || 1);
    const setterCount = team.players.filter((p) => p.skillLevel === "SETTER").length;
    const femaleCount = team.players.filter((p) => p.gender === "FEMALE").length;
    return {
      team: team.name,
      size: team.players.length,
      avgSkillScore: Math.round(avgSkill * 100) / 100,
      setters: setterCount,
      females: femaleCount,
    };
  });
}