"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Trophy, Calendar, Users, Loader2,
  ChevronRight, ShieldCheck,
} from "lucide-react";
import { getStatusConfig } from "@/lib/game-utils";

// ── Types ──────────────────────────────────────────────────────
type Game = {
  id: string;
  date: string;
  venue: string;
  maxPlayers: number;
  status: string;
  confirmedCount: number;
  teamsCount: number;
};

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ── Data fetch ─────────────────────────────────────────────────
async function fetchGames(): Promise<{ games: Game[] }> {
  const res = await fetch("/api/admin/games");
  if (!res.ok) throw new Error("Failed to fetch games");
  return res.json();
}

// ── Page ───────────────────────────────────────────────────────
export default function AdminTeamsHubPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-games-for-teams"],
    queryFn: fetchGames,
  });

  const games = data?.games ?? [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Trophy className="text-orange-500 h-7 w-7" />
          Teams
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Select a game to manage its teams
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-16 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
          Failed to load games. Please refresh.
        </div>
      )}

      {!isLoading && !error && games.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No games yet. Create a game first.</p>
          <Link
            href="/admin/games"
            className="inline-block mt-4 text-orange-400 hover:text-orange-300 text-sm"
          >
            Go to Games →
          </Link>
        </div>
      )}

      {!isLoading && !error && games.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/admin/games/${game.id}/teams`}
              className="bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-xl p-5 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={game.status} />
                  {game.teamsCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {game.teamsCount} teams set
                    </span>
                  )}
                </div>
                <p className="text-white font-semibold truncate">
                  {new Date(game.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {game.confirmedCount}/{game.maxPlayers} players · {game.venue}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}