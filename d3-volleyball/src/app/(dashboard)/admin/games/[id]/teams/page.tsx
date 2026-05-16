"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, Users, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────
type Team = {
  id: string;
  number: number;
  name: string;
  members: Array<{
    userId: string;
    user: {
      id: string;
      fullName: string;
      nickname: string;
      skillLevel: string;
      gender: string;
      rankingScore: number;
      profilePhoto: string | null;
    };
  }>;
};

type GameStatus = {
  status: string;
  teamsPublished: boolean;
};

// ── Fetch Functions ───────────────────────────────────────────
async function fetchTeams(gameId: string): Promise<{ teams: Team[] }> {
  const res = await fetch(`/api/admin/games/${gameId}/teams`);
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

async function fetchGameStatus(gameId: string): Promise<GameStatus> {
  const res = await fetch(`/api/admin/games/${gameId}`);
  if (!res.ok) throw new Error("Failed to fetch game status");
  return res.json();
}

async function generateTeams(gameId: string, teamCount: number) {
  const res = await fetch(`/api/admin/games/${gameId}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamCount }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Failed to generate teams");
  return result;
}

// ── Component ─────────────────────────────────────────────────
export default function TeamsPage() {
  const params = useParams();
  const gameId = params.id as string;
  const queryClient = useQueryClient();
  const [selectedWinner, setSelectedWinner] = useState("");

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams", gameId],
    queryFn: () => fetchTeams(gameId),
    enabled: !!gameId,
  });

  const { data: gameData } = useQuery({
    queryKey: ["gameStatus", gameId],
    queryFn: () => fetchGameStatus(gameId),
    enabled: !!gameId,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateTeams(gameId, 2),
    onSuccess: (data) => {
      toast.success(data.message ?? "Teams generated successfully");
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningTeamId: selectedWinner }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to finalize");
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? "Game finalized successfully");
      setSelectedWinner("");
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
      queryClient.invalidateQueries({ queryKey: ["gameStatus", gameId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const teams = teamsData?.teams ?? [];
  const isPublished = gameData?.teamsPublished ?? false;
  const gameStatus = gameData?.status ?? "";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Game Teams</h1>
        <p className="text-slate-400 mt-1">
          View and manage teams for this game
        </p>
      </div>

      {/* Generate Teams Button */}
      {teams.length === 0 && !teamsLoading && (
        <div className="mb-8 p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <p className="text-slate-400 mb-4">No teams generated yet</p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Generate Teams
          </Button>
        </div>
      )}

      {/* Teams Grid */}
      {teamsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : teams.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{team.name}</h3>
                  <span className="text-2xl font-bold text-orange-500">
                    #{team.number}
                  </span>
                </div>

                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.userId}
                      className="bg-slate-800 rounded-lg p-3 text-sm"
                    >
                      <div className="font-semibold text-white">
                        {member.user.fullName}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {member.user.skillLevel} •{" "}
                        <span className="text-yellow-400">
                          ⭐ {member.user.rankingScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 text-center text-xs text-slate-400">
                  {team.members.length} players
                </div>
              </div>
            ))}
          </div>

          {/* Finalize Game Results Section */}
          {gameStatus !== "COMPLETED" && (
            <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Finalize Game Results
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Select the winning team to award +1 ranking point to their
                players.
              </p>
              <div className="flex gap-3">
                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1">
                    <SelectValue placeholder="Select winning team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {teams.map((team) => (
                      <SelectItem
                        key={team.id}
                        value={team.id}
                        className="text-white"
                      >
                        {team.name} ({team.members.length} players)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => finalizeMutation.mutate()}
                  disabled={
                    !selectedWinner || finalizeMutation.isPending
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {finalizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Finalize & Award Points
                </Button>
              </div>
            </div>
          )}

          {/* Completed Status */}
          {gameStatus === "COMPLETED" && (
            <div className="mt-8 p-6 bg-green-900/20 border border-green-800 rounded-xl">
              <p className="text-green-400 font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Game is finalized and results are recorded
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No teams found for this game</p>
        </div>
      )}
    </div>
  );
}