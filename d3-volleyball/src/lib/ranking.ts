/**
 * D3 Ranking System
 *
 * Formula: rankingScore = Math.round((rankingPoints / gamesPlayed) * 100)
 *
 * Example: 3 points / 12 games = 0.25 × 100 = 25
 */

// ── Core formula ───────────────────────────────────────────────
export function calculateRankingScore(
  points: number,
  gamesPlayed: number
): number {
  if (gamesPlayed === 0) return 0;
  return Math.round((points / gamesPlayed) * 100);
}

// ── Win rate percentage ────────────────────────────────────────
export function calculateWinRate(wins: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return Math.round((wins / gamesPlayed) * 100);
}

// ── Rank label based on score ──────────────────────────────────
export function getRankLabel(score: number): string {
  if (score >= 80) return "Elite";
  if (score >= 60) return "Pro";
  if (score >= 40) return "Intermediate";
  if (score >= 20) return "Amateur";
  return "Rookie";
}

// ── Rank color ─────────────────────────────────────────────────
export function getRankColor(score: number): string {
  if (score >= 80) return "text-yellow-400";
  if (score >= 60) return "text-purple-400";
  if (score >= 40) return "text-blue-400";
  if (score >= 20) return "text-green-400";
  return "text-slate-400";
}