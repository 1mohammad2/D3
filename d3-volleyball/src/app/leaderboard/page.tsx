"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Search, Loader2, Medal, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Input } from "@/components/ui/input";
import { getRankColor, getRankLabel } from "@/lib/ranking";

// ── Types ──────────────────────────────────────────────────────
type Player = {
  id: string;
  fullName: string;
  nickname: string | null;
  skillLevel: string;
  gender: string;
  rankingScore: number;
  rankingPoints: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
  profilePhoto: string | null;
};

// ── Constants ──────────────────────────────────────────────────
const SKILL_FILTERS = ["ALL", "SETTER", "ADVANCED", "INTERMEDIATE", "BEGINNER"];

const SKILL_COLORS: Record<string, string> = {
  SETTER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ADVANCED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  INTERMEDIATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BEGINNER: "bg-green-500/20 text-green-400 border-green-500/30",
};

const TOP3_CONFIG = [
  { rank: 2, size: "h-32", medal: "🥈", border: "border-slate-400/40", glow: "shadow-slate-400/20", offset: "mt-8" },
  { rank: 1, size: "h-40", medal: "🥇", border: "border-yellow-400/40", glow: "shadow-yellow-400/20", offset: "mt-0" },
  { rank: 3, size: "h-28", medal: "🥉", border: "border-amber-600/40", glow: "shadow-amber-600/20", offset: "mt-12" },
];

// ── Avatar Component ───────────────────────────────────────────
function PlayerAvatar({
  player,
  size = "md",
}: {
  player: Player;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-white font-black shrink-0`}
    >
      {player.fullName[0]}
    </div>
  );
}

// ── Top 3 Podium ───────────────────────────────────────────────
function TopThreePodium({ players }: { players: Player[] }) {
  if (players.length < 1) return null;

  // Reorder to show 2nd, 1st, 3rd
  const podiumOrder = [
    players[1] ?? null,
    players[0],
    players[2] ?? null,
  ];
  const configs = TOP3_CONFIG;

  return (
    <div className="flex items-end justify-center gap-4 mb-12">
      {podiumOrder.map((player, i) => {
        if (!player) return <div key={i} className="w-28" />;
        const config = configs[i];

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`${config.offset} flex flex-col items-center`}
          >
            {/* Medal */}
            <span className="text-3xl mb-2">{config.medal}</span>

            {/* Card */}
            <div
              className={`w-28 ${config.size} bg-slate-900 border ${config.border}
                rounded-2xl flex flex-col items-center justify-center p-3
                shadow-lg ${config.glow} relative overflow-hidden`}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              <PlayerAvatar player={player} size="lg" />

              <p className="text-white font-bold text-xs text-center mt-2 leading-tight">
                {player.nickname ?? player.fullName.split(" ")[0]}
              </p>

              <p className={`font-black text-lg mt-1 ${getRankColor(player.rankingScore)}`}>
                {player.rankingScore}
              </p>

              <p className="text-slate-500 text-xs">pts</p>
            </div>

            {/* Rank number base */}
            <div className="w-28 h-8 bg-slate-800 border border-slate-700 rounded-b-xl flex items-center justify-center">
              <span className="text-slate-400 text-xs font-bold">#{player.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Ranked Row (4th place onwards) ────────────────────────────
function RankedRow({ player, index }: { player: Player; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors group"
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        <span className="text-slate-500 font-bold text-sm">#{player.rank}</span>
      </div>

      {/* Avatar */}
      <PlayerAvatar player={player} size="md" />

      {/* Name + skill */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm truncate">
            {player.fullName}
          </span>
          {player.nickname && (
            <span className="text-slate-500 text-xs">({player.nickname})</span>
          )}
          {player.gender === "FEMALE" && (
            <span className="text-pink-400 text-xs">♀</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${SKILL_COLORS[player.skillLevel]}`}
          >
            {player.skillLevel}
          </span>
          <span className={`text-xs font-medium ${getRankColor(player.rankingScore)}`}>
            {getRankLabel(player.rankingScore)}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="hidden sm:block w-24">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Score</span>
          <span className="text-white font-bold">{player.rankingScore}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
            style={{ width: `${Math.min(player.rankingScore, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 shrink-0">
        <div className="text-center">
          <p className="text-white font-bold">{player.gamesPlayed}</p>
          <p>Games</p>
        </div>
        <div className="text-center">
          <p className="text-green-400 font-bold">{player.wins}</p>
          <p>Wins</p>
        </div>
        <div className="text-center">
          <p className="text-orange-400 font-bold">{player.winRate}%</p>
          <p>Win Rate</p>
        </div>
      </div>

      {/* Mobile score */}
      <div className="sm:hidden shrink-0 text-right">
        <p className={`font-black text-lg ${getRankColor(player.rankingScore)}`}>
          {player.rankingScore}
        </p>
        <p className="text-slate-500 text-xs">pts</p>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", skillFilter],
    queryFn: async () => {
      const url = `/api/leaderboard?skill=${skillFilter}&limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 60000,
  });

  const allPlayers: Player[] = data?.players ?? [];

  // Filter by search
  const filtered = allPlayers.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.nickname?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero Header */}
      <div className="relative pt-24 pb-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Trophy className="h-14 w-14 text-orange-500 mx-auto mb-4" />
            <h1 className="text-5xl font-black text-white">Leaderboard</h1>
            <p className="text-slate-400 mt-2">
              Rankings based on performance across all games
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Skill filters */}
          <div className="flex gap-2 flex-wrap">
            {SKILL_FILTERS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSkillFilter(skill)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  skillFilter === skill
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-white"
                }`}
              >
                {skill === "ALL" ? "All Levels" : skill}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No players found</p>
            <p className="text-sm mt-1">
              {search ? "Try a different search" : "Players will appear after their first game"}
            </p>
          </div>
        )}

        {/* Top 3 Podium */}
        {!isLoading && top3.length >= 1 && !search && skillFilter === "ALL" && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-6">
              <Medal className="h-5 w-5 text-yellow-400" />
              <h2 className="text-white font-bold">Top Players</h2>
            </div>
            <TopThreePodium players={top3} />
          </div>
        )}

        {/* Ranked List */}
        {!isLoading && filtered.length > 0 && (
          <div>
            {(!search && skillFilter === "ALL") && rest.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                <h2 className="text-slate-400 font-medium text-sm">
                  Full Rankings
                </h2>
              </div>
            )}

            <div className="space-y-2">
              <AnimatePresence>
                {(search || skillFilter !== "ALL" ? filtered : rest).map(
                  (player, index) => (
                    <RankedRow key={player.id} player={player} index={index} />
                  )
                )}
              </AnimatePresence>
            </div>

            {/* Player count */}
            <p className="text-center text-slate-600 text-sm mt-6">
              Showing {filtered.length} player{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}