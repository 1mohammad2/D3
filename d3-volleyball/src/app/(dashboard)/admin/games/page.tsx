"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Calendar, Users, Clock, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getStatusConfig } from "@/lib/game-utils";

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
};

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
  if (!res.ok) throw new Error(result.error || "Failed to create game");
  return result;
}

async function deleteGame(id: string) {
  const res = await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to delete game");
  return result;
}

// ── Status Badge ───────────────────────────────────────────
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

export default function AdminGamesPage() {
  const router = useRouter();
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
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      setDialogOpen(false);
      setForm({ date: "", venue: "Main Court", maxPlayers: 36 });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const games: Game[] = data?.games ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Games</h1>
          <p className="text-slate-400 mt-1">
            Schedule and manage volleyball games
          </p>
        </div>

        {/* Create Game Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Game</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Date Time */}
              <div className="space-y-2">
                <Label className="text-slate-300">Game Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-slate-500 text-xs">
                  Registration will open automatically 30 hours before
                </p>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label className="text-slate-300">Venue</Label>
                <Input
                  value={form.venue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  placeholder="Main Court"
                  className="bg-slate-800 border-slate-700 text-white"
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
                      maxPlayers: parseInt(e.target.value),
                    }))
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.date || createMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
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

      {/* Games List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No games scheduled</p>
          <p className="text-sm mt-1">Create your first game above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Game Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={game.status} />
                  <span className="text-slate-500 text-sm">{game.venue}</span>
                </div>

                <p className="text-white font-bold text-lg">
                  {new Date(game.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>

                <p className="text-slate-400 text-sm">
                  {new Date(game.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Stats Row */}
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
                </div>

                {/* Spots Progress */}
                <div className="mt-3 w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                    style={{
                      width: `${(game.confirmedCount / game.maxPlayers) * 100}%`,
                    }}
                  />
                </div>

                <p className="text-slate-500 text-xs mt-1">
                  Registration opens:{" "}
                  {new Date(game.registrationOpensAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/games/${game.id}/teams`)}
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                <Users className="h-4 w-4 mr-1" />
                Teams
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      "Delete this game? This cannot be undone."
                    )
                  ) {
                    deleteMutation.mutate(game.id);
                  }
                }}
                disabled={
                  deleteMutation.isPending || game.confirmedCount > 0
                }
                className="border-red-800 text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                title={
                  game.confirmedCount > 0
                    ? "Cannot delete: has registrations"
                    : "Delete game"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}