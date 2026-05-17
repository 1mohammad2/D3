"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Calendar, Users, Clock,
  Trash2, Loader2, Trophy, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { getStatusConfig } from "@/lib/game-utils";

// ── Types ──────────────────────────────────────────────────────
type Game = {
  id: string;
  date: string;
  venue: string;
  maxPlayers: number;
  status: string;
  registrationOpensAt: string;
  confirmedCount: number;
  waitingCount: number;
  availableSpots: number;
  teamsCount: number;
};

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ── API calls ──────────────────────────────────────────────────
async function fetchGames() {
  const res = await fetch("/api/admin/games");
  if (!res.ok) throw new Error("Failed to fetch games");
  return res.json();
}

async function createGame(data: {
  date: string;
  venue: string;
  maxPlayers: number;
}) {
  const res = await fetch("/api/admin/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Failed to create game");
  return result;
}

async function deleteGame(id: string) {
  const res = await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Failed to delete game");
  return result;
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminGamesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    date: "",
    venue: "Main Court",
    maxPlayers: 36,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: fetchGames,
  });

  const createMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      setDialogOpen(false);
      setForm({ date: "", venue: "Main Court", maxPlayers: 36 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const games: Game[] = data?.games ?? [];

  return (
    <div className="p-8">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Games</h1>
          <p className="text-slate-400 mt-1">
            Schedule and manage volleyball games
          </p>
        </div>

        {/* Create Game Button + Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                Create New Game
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Date & Time */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Game Date & Time *
                </Label>
                <Input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-slate-500 text-xs">
                  ⏰ Registration opens automatically 30 hours before
                </p>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label className="text-slate-300">Venue</Label>
                <Input
                  value={form.venue}
                  placeholder="Main Court"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Max Players */}
              <div className="space-y-2">
                <Label className="text-slate-300">Max Players</Label>
                <Input
                  type="number"
                  min={6}
                  max={100}
                  value={form.maxPlayers}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxPlayers: parseInt(e.target.value) || 36,
                    }))
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.date || createMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Loading ───────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────── */}
      {!isLoading && games.length === 0 && (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Calendar className="h-14 w-14 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 text-lg font-medium">
            No games scheduled
          </p>
          <p className="text-slate-600 text-sm mt-1">
            Create your first game above
          </p>
        </div>
      )}

      {/* ── Games List ────────────────────────────────────────── */}
      {!isLoading && games.length > 0 && (
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                {/* ── Game Info ─────────────────────────────── */}
                <div className="flex-1">
                  {/* Status + Venue */}
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={game.status} />
                    <span className="text-slate-500 text-sm">
                      {game.venue}
                    </span>
                  </div>

                  {/* Date */}
                  <p className="text-white font-bold text-lg">
                    {new Date(game.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {new Date(game.date).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Users className="h-4 w-4" />
                      {game.confirmedCount}/{game.maxPlayers} players
                    </span>
                    {game.waitingCount > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-orange-400">
                        <Clock className="h-4 w-4" />
                        {game.waitingCount} waiting
                      </span>
                    )}
                    {game.teamsCount > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-purple-400">
                        <Trophy className="h-4 w-4" />
                        {game.teamsCount} teams
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (game.confirmedCount / game.maxPlayers) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Registration opens */}
                  <p className="text-slate-600 text-xs mt-2">
                    Registration opens:{" "}
                    {new Date(game.registrationOpensAt).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                {/* ── Action Buttons ────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">

                  {/* Teams button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 h-9"
                  >
                    <Link href={`/admin/games/${game.id}/teams`}>
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Teams
                    </Link>
                  </Button>

                  {/* Schedule button */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 h-9"
                  >
                    <Link href={`/admin/games/${game.id}/schedule`}>
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Schedule
                    </Link>
                  </Button>

                  {/* Registrations link */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 h-9"
                  >
                    <Link href={`/admin/games/${game.id}/players`}>
                      <Shield className="h-3.5 w-3.5 mr-1.5" />
                      Players
                    </Link>
                  </Button>
                  {/* Attendance button — show only for past/completed games */}
                  {/* Attendance button — show only for past/completed games */}

                   {/* Attendance button — show only for past/completed games */}
                  <Button
                     asChild
                      variant="outline"
                       size="sm"
                        className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 h-9">

                        <Link href={`/admin/games/${game.id}/attendance`}>
                         <Users className="h-3.5 w-3.5 mr-1.5" />
                         Attendance
                        </Link>
                  </Button>
                  {/* Delete button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      deleteMutation.isPending || game.confirmedCount > 0
                    }
                    onClick={() => {
                      if (confirm("Delete this game? This cannot be undone.")) {
                        deleteMutation.mutate(game.id);
                      }
                    }}
                    title={
                      game.confirmedCount > 0
                        ? "Cannot delete: has registrations"
                        : "Delete game"
                    }
                    className="border-red-900 text-red-400 hover:bg-red-500/10 hover:border-red-700 h-9 disabled:opacity-30"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}