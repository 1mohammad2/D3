"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
  Calendar, Eye, RefreshCw,
  Loader2, Trophy, CheckCircle, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
type TeamInfo = { id: string; name: string; number: number };

type Match = {
  id: string;
  round: number;
  court: number;
  homeTeamId: string;
  awayTeamId: string;
  winnerId: string | null;
  isCompleted: boolean;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
};

// ── Match Card ─────────────────────────────────────────────────
function MatchCard({
  match,
  onSaveResult,
  saving,
}: {
  match: Match;
  onSaveResult: (matchId: string, winnerId: string) => void;
  saving: boolean;
}) {
  const [winner, setWinner] = useState("");

  const courtColor =
    match.court === 1
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-purple-500/20 text-purple-400 border-purple-500/30";

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        match.isCompleted
          ? "bg-slate-900/30 border-slate-800/40"
          : "bg-slate-900 border-slate-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${courtColor}`}>
          Court {match.court}
        </span>
        {match.isCompleted
          ? <CheckCircle className="h-4 w-4 text-green-400" />
          : <Circle className="h-4 w-4 text-slate-700" />
        }
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-3">
        <p className={`font-bold text-sm ${
          match.winnerId === match.homeTeamId ? "text-orange-400" : "text-white"
        }`}>
          {match.homeTeam.name}
        </p>
        <span className="text-slate-600 text-xs font-black mx-2">VS</span>
        <p className={`font-bold text-sm text-right ${
          match.winnerId === match.awayTeamId ? "text-orange-400" : "text-white"
        }`}>
          {match.awayTeam.name}
        </p>
      </div>

      {/* Result */}
      {match.isCompleted && match.winnerId && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          {match.winnerId === match.homeTeamId
            ? match.homeTeam.name
            : match.awayTeam.name}{" "}
          won
        </p>
      )}

      {/* Enter result */}
      {!match.isCompleted && (
        <div className="flex gap-2 mt-3">
          <Select value={winner} onValueChange={setWinner}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-8 flex-1">
              <SelectValue placeholder="Who won?" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value={match.homeTeamId} className="text-white text-xs">
                🏆 {match.homeTeam.name}
              </SelectItem>
              <SelectItem value={match.awayTeamId} className="text-white text-xs">
                🏆 {match.awayTeam.name}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!winner || saving}
            onClick={() => { onSaveResult(match.id, winner); setWinner(""); }}
            className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3 text-xs"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function SchedulePage() {
  const params = useParams();
  const gameId = params.id as string;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/schedule`);
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/schedule`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      return json;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["schedule", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resultMutation = useMutation({
    mutationFn: async ({ matchId, winnerId }: { matchId: string; winnerId: string }) => {
      const res = await fetch(`/api/admin/games/${gameId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "result", matchId, winnerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      return json;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["schedule", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to publish");
      return json;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["schedule", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const matches: Match[] = data?.matches ?? [];
  const isPublished: boolean = data?.schedulePublished ?? false;
  const completed = matches.filter((m) => m.isCompleted).length;

  // Group by round
  const rounds: Record<number, Match[]> = {};
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Link href="/admin/games" className="hover:text-white transition-colors">
              Games
            </Link>
            <span>/</span>
            <span className="text-white">Schedule</span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Calendar className="text-orange-500 h-8 w-8" />
            Match Schedule
          </h1>
          <p className="text-slate-400 mt-1">
            Generate schedule → enter results → publish to players
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={generateMutation.isPending || isPublished}
            onClick={() => {
              if (
                matches.length === 0 ||
                confirm("This will replace the current schedule. Continue?")
              ) {
                generateMutation.mutate();
              }
            }}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            {generateMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <RefreshCw className="h-4 w-4 mr-2" />}
            {matches.length > 0 ? "Regenerate" : "Generate"}
          </Button>

          <Button
            disabled={matches.length === 0 || isPublished || publishMutation.isPending}
            onClick={() => publishMutation.mutate()}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {publishMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <Eye className="h-4 w-4 mr-2" />}
            {isPublished ? "Published ✓" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Published banner */}
      {isPublished && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <Eye className="h-5 w-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm font-medium">
            Schedule is live — players can see it now.
          </p>
        </div>
      )}

      {/* Stats */}
      {matches.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Matches", value: matches.length },
            { label: "Completed", value: completed },
            { label: "Remaining", value: matches.length - completed },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="text-slate-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && matches.length === 0 && (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Calendar className="h-14 w-14 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 text-lg font-medium">No schedule yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Make sure teams are published first
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {generateMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : null}
            Generate Schedule
          </Button>
        </div>
      )}

      {/* Schedule by rounds */}
      {!isLoading && Object.keys(rounds).length > 0 && (
        <div className="space-y-8">
          {Object.entries(rounds)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([roundNum, roundMatches]) => (
              <div key={roundNum}>
                {/* Round header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <span className="text-orange-400 font-black text-sm">
                      {roundNum}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      Time Block {roundNum}
                    </h3>
                    <p className="text-slate-500 text-xs">
                      {roundMatches.length} match{roundMatches.length > 1 ? "es" : ""} —{" "}
                      {roundMatches.filter((m) => m.isCompleted).length} completed
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* Match cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roundMatches
                    .sort((a, b) => a.court - b.court)
                    .map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onSaveResult={(matchId, winnerId) =>
                          resultMutation.mutate({ matchId, winnerId })
                        }
                        saving={resultMutation.isPending}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}