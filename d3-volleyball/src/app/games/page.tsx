"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Calendar, Users, Clock, CheckCircle,
  Loader2, ChevronRight, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { getStatusConfig, canCancelRegistration } from "@/lib/game-utils";
import { CountdownTimer } from "@/components/home/countdown-timer";

// ── Types ──────────────────────────────────────────────────────
type GameData = {
  id: string;
  date: string;
  venue: string;
  maxPlayers: number;
  status: string;
  registrationOpensAt: string;
  confirmedCount: number;
  waitingCount: number;
  availableSpots: number;
  userRegistrationStatus: string | null;
  userWaitingPosition: number | null;
};

type LiveGame = {
  id: string;
  confirmedCount: number;
  waitingCount: number;
  availableSpots: number;
  status: string;
};

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
          status === "REGISTRATION_OPEN" ? "animate-pulse" : ""
        }`}
      />
      {config.label}
    </span>
  );
}

// ── Single Game Card ───────────────────────────────────────────
function GameCard({
  game,
  onRegister,
  onCancel,
  isLoading,
  isLoggedIn,
}: {
  game: GameData;
  onRegister: (id: string) => void;
  onCancel: (id: string) => void;
  isLoading: boolean;
  isLoggedIn: boolean;
}) {
  const isRegistered = game.userRegistrationStatus === "CONFIRMED";
  const isWaitlisted = game.userWaitingPosition !== null;
  const canCancel = canCancelRegistration(new Date(game.date));
  const isOpen = game.status === "REGISTRATION_OPEN";
  const isFull = game.status === "FULL";
  const isUpcoming = game.status === "UPCOMING";

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <StatusBadge status={game.status} />
          <p className="text-white font-bold text-xl mt-2">
            {new Date(game.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date(game.date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {game.venue}
          </p>
        </div>

        {/* User status pills */}
        {isRegistered && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium shrink-0">
            <CheckCircle className="h-3.5 w-3.5" />
            Registered
          </span>
        )}
        {isWaitlisted && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-medium shrink-0">
            <Clock className="h-3.5 w-3.5" />
            #{game.userWaitingPosition} Waiting
          </span>
        )}
      </div>

      {/* Countdown */}
      {(isOpen || isUpcoming) && (
        <div className="mb-5">
          <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider text-center">
            {isUpcoming ? "Registration opens in" : "Game starts in"}
          </p>
          <CountdownTimer
            targetDate={isUpcoming ? game.registrationOpensAt : game.date}
          />
        </div>
      )}

      {/* Spots bar */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {game.confirmedCount} / {game.maxPlayers} registered
          </span>
          {game.waitingCount > 0 && (
            <span className="text-orange-400 text-xs">
              +{game.waitingCount} waiting
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? "bg-yellow-500"
                : "bg-gradient-to-r from-orange-500 to-orange-400"
            }`}
            style={{
              width: `${Math.min(
                (game.confirmedCount / game.maxPlayers) * 100,
                100
              )}%`,
            }}
          />
        </div>
        <p className="text-slate-600 text-xs mt-1">
          {game.availableSpots > 0
            ? `${game.availableSpots} spots remaining`
            : "All spots filled"}
        </p>
      </div>

      {/* Action buttons */}
      {!isLoggedIn && (
        <Button
          asChild
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          <Link href="/login">Login to Register</Link>
        </Button>
      )}

      {isLoggedIn && isRegistered && (
        canCancel ? (
          <Button
            variant="outline"
            onClick={() => onCancel(game.id)}
            disabled={isLoading}
            className="w-full border-red-800 text-red-400 hover:bg-red-500/10"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Cancel Registration
          </Button>
        ) : (
          <p className="text-center text-slate-500 text-sm py-2">
            ⛔ Cannot cancel within 4 hours of game
          </p>
        )
      )}

      {isLoggedIn && isWaitlisted && !isRegistered && (
        <Button
          variant="outline"
          onClick={() => onCancel(game.id)}
          disabled={isLoading}
          className="w-full border-slate-700 text-slate-400 hover:text-white"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Leave Waiting List
        </Button>
      )}

      {isLoggedIn && !isRegistered && !isWaitlisted && isOpen && (
        <Button
          onClick={() => onRegister(game.id)}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Register — {game.availableSpots} spots left
        </Button>
      )}

      {isLoggedIn && !isRegistered && !isWaitlisted && isFull && (
        <Button
          onClick={() => onRegister(game.id)}
          disabled={isLoading}
          variant="outline"
          className="w-full border-orange-800 text-orange-400 hover:bg-orange-500/10"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <Clock className="h-4 w-4 mr-2" />
          Join Waiting List
        </Button>
      )}

      {isLoggedIn && !isRegistered && !isWaitlisted && isUpcoming && (
        <Button disabled className="w-full" variant="outline">
          Registration not open yet
        </Button>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function GamesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Main games data
  const { data, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await fetch("/api/games");
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Live spot counts — lightweight polling
  const { data: liveData } = useQuery({
    queryKey: ["games-live"],
    queryFn: async () => {
      const res = await fetch("/api/games/live");
      if (!res.ok) return { games: [] };
      return res.json() as Promise<{ games: LiveGame[] }>;
    },
    refetchInterval: 20000,
    refetchIntervalInBackground: true,
    staleTime: 15000,
  });

  // Merge live data into main games data
  useEffect(() => {
    if (!liveData?.games?.length) return;
    queryClient.setQueryData(
      ["games"],
      (old: { games: GameData[] } | undefined) => {
        if (!old?.games) return old;
        return {
          ...old,
          games: old.games.map((game) => {
            const live = liveData.games.find((g: LiveGame) => g.id === game.id);
            if (!live) return game;
            return {
              ...game,
              confirmedCount: live.confirmedCount,
              waitingCount: live.waitingCount,
              availableSpots: live.availableSpots,
              status: live.status,
            };
          }),
        };
      }
    );
  }, [liveData, queryClient]);

  const registerMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const res = await fetch(`/api/games/${gameId}/register`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Registration failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["games-live"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const res = await fetch(`/api/games/${gameId}/register`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Cancellation failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["games-live"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const games: GameData[] = data?.games ?? [];
  const isMutating = registerMutation.isPending || cancelMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <Calendar className="text-orange-500 h-10 w-10" />
            Games
          </h1>
          <p className="text-slate-400 mt-2">
            Register before spots fill up!
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && games.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Calendar className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No upcoming games</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}

        {/* Games Grid */}
        {!isLoading && games.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onRegister={(id) => registerMutation.mutate(id)}
                onCancel={(id) => cancelMutation.mutate(id)}
                isLoading={isMutating}
                isLoggedIn={!!session?.user}
              />
            ))}
          </div>
        )}

        {/* Admin link */}
        {session?.user?.role === "ADMIN" && (
          <div className="mt-8 text-center">
            <Link
              href="/admin/games"
              className="text-orange-400 hover:text-orange-300 text-sm flex items-center justify-center gap-1"
            >
              Manage Games in Admin Panel
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}