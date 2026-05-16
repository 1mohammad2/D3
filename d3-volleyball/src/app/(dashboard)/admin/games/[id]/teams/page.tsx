"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, Zap, Eye, Loader2,
  Trophy, Shield, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
type TeamMember = {
  id: string;
  isCaptain: boolean;
  user: {
    id: string;
    fullName: string;
    nickname: string | null;
    skillLevel: string;
    gender: string;
    rankingScore: number;
  };
};

type Team = {
  id: string;
  name: string;
  number: number;
  isPublished: boolean;
  members: TeamMember[];
};

// ── Skill Colors ───────────────────────────────────────────────
const skillColors: Record<string, string> = {
  SETTER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ADVANCED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  INTERMEDIATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BEGINNER: "bg-green-500/20 text-green-400 border-green-500/30",
};

// ── Team Card ──────────────────────────────────────────────────
function TeamCard({ team }: { team: Team }) {
  const avgScore =
    team.members.length > 0
      ? Math.round(
          team.members.reduce((s, m) => s + m.user.rankingScore, 0) /
          team.members.length
        )
      : 0;

  const femaleCount = team.members.filter(
    (m) => m.user.gender === "FEMALE"
  ).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <span className="text-orange-400 font-black text-sm">
                {team.number}
              </span>
            </div>
            <h3 className="text-white font-bold">{team.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{team.members.length} players</span>
            {femaleCount > 0 && <span>· {femaleCount}F</span>}
            <span>· avg {avgScore}pts</span>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="p-3 space-y-2">
        {team.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {member.user.fullName[0]}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white text-sm font-medium truncate">
                  {member.user.fullName}
                </span>
                {member.isCaptain && (
                  <Shield className="h-3 w-3 text-orange-400 shrink-0" />
                )}
                {member.user.gender === "FEMALE" && (
                  <span className="text-pink-400 text-xs shrink-0">♀</span>
                )}
              </div>
              <span
                className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium mt-0.5
                  ${skillColors[member.user.skillLevel]}`}
              >
                {member.user.skillLevel}
              </span>
            </div>

            {/* Score */}
            <span className="text-slate-400 text-xs shrink-0">
              {member.user.rankingScore}pts
            </span>
          </div>
        ))}

        {team.members.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-4">
            No players assigned
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TeamsPage() {
  const params = useParams();
  const gameId = params.id as string;
  const queryClient = useQueryClient();
  const [isPublished, setIsPublished] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["teams", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/teams`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      const json = await res.json();
      if (json.teams.length > 0) {
        setIsPublished(json.teams[0].isPublished);
      }
      return json;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/teams`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/teams`, {
        method: "PATCH",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Publish failed");
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setIsPublished(true);
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const teams: Team[] = data?.teams ?? [];

  const handleGenerate = () => {
    if (
      teams.length > 0 &&
      !confirm(
        "This will replace existing teams. Are you sure?"
      )
    ) {
      return;
    }
    generateMutation.mutate();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link href="/admin/games" className="hover:text-white transition-colors">
              Games
            </Link>
            <span>/</span>
            <span className="text-white">Team Management</span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Trophy className="text-orange-500 h-8 w-8" />
            Teams
          </h1>
          <p className="text-slate-400 mt-1">
            Generate and manage teams for this game
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || isPublished}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {teams.length > 0 ? "Regenerate" : "Generate Teams"}
          </Button>

          <Button
            onClick={() => publishMutation.mutate()}
            disabled={
              publishMutation.isPending ||
              teams.length === 0 ||
              isPublished
            }
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {publishMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {isPublished ? "Published ✓" : "Publish Teams"}
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {isPublished && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <Eye className="h-5 w-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm font-medium">
            Teams are published — players can now see their team assignments.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && teams.length === 0 && (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Users className="h-14 w-14 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 text-lg font-medium">No teams generated yet</p>
          <p className="text-slate-600 text-sm mt-1 mb-6">
            Make sure players have registered first
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Generate Teams Now
          </Button>
        </div>
      )}

      {/* Teams Grid */}
      {!isLoading && teams.length > 0 && (
        <>
          {/* Balance summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Teams", value: teams.length, icon: Trophy },
              {
                label: "Total Players",
                value: teams.reduce((s, t) => s + t.members.length, 0),
                icon: Users,
              },
              {
                label: "Setters",
                value: teams.reduce(
                  (s, t) =>
                    s +
                    t.members.filter(
                      (m) => m.user.skillLevel === "SETTER"
                    ).length,
                  0
                ),
                icon: Shield,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center"
              >
                <Icon className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-slate-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}