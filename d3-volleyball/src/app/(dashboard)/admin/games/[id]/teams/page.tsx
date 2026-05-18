"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users, Zap, Eye, Loader2, Trophy,
  Shield, RefreshCw, GripVertical,
  Calendar, Save, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
type Player = {
  id: string;
  fullName: string;
  nickname: string | null;
  skillLevel: string;
  gender: string;
  rankingScore: number;
};

type TeamMember = {
  id: string;
  isCaptain: boolean;
  user: Player;
};

type Team = {
  id: string;
  name: string;
  number: number;
  isPublished: boolean;
  members: TeamMember[];
};

type ApiResponse = {
  teams: Team[];
};

type LocalTeam = {
  id: string;
  name: string;
  number: number;
  captainId: string | null;
  players: Player[];
};

// ── Skill colors ───────────────────────────────────────────────
const SKILL_COLORS: Record<string, string> = {
  SETTER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ADVANCED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  INTERMEDIATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BEGINNER: "bg-green-500/20 text-green-400 border-green-500/30",
};

// ── Convert API data to local state ───────────────────────────
function teamsToLocal(teams: Team[]): LocalTeam[] {
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    number: t.number,
    captainId:
      t.members.find((m) => m.isCaptain)?.user.id ??
      t.members[0]?.user.id ??
      null,
    players: t.members.map((m) => m.user),
  }));
}

// ── Draggable Player Card ──────────────────────────────────────
function DraggablePlayer({
  player,
  isCaptain,
}: {
  player: Player;
  isCaptain: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 cursor-grab active:cursor-grabbing"
    >
      <div
        {...attributes}
        {...listeners}
        className="text-slate-600 hover:text-slate-400 shrink-0 touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {player.fullName[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-white text-xs font-semibold truncate">
            {player.nickname ?? player.fullName.split(" ")[0]}
          </p>
          {isCaptain && <Shield className="h-3 w-3 text-orange-400 shrink-0" />}
          {player.gender === "FEMALE" && (
            <span className="text-pink-400 text-xs shrink-0">♀</span>
          )}
        </div>
        <span
          className={`text-xs px-1 py-0.5 rounded border font-medium ${
            SKILL_COLORS[player.skillLevel] ?? ""
          }`}
        >
          {player.skillLevel.substring(0, 3)}
        </span>
      </div>

      <span className="text-slate-500 text-xs shrink-0">
        {player.rankingScore}
      </span>
    </div>
  );
}

// ── Droppable Team Column ──────────────────────────────────────
function TeamColumn({
  team,
  isOver,
  isPublished,
  onCaptainChange,
}: {
  team: LocalTeam;
  isOver: boolean;
  isPublished: boolean;
  onCaptainChange: (teamId: string, playerId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: team.id });

  const avgScore =
    team.players.length > 0
      ? Math.round(
          team.players.reduce((s, p) => s + p.rankingScore, 0) /
            team.players.length
        )
      : 0;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border transition-all min-h-48 ${
        isOver
          ? "border-orange-500/50 bg-orange-500/5"
          : "border-slate-700 bg-slate-900"
      }`}
    >
      {/* Team header */}
      <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-800/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <span className="text-orange-400 font-black text-xs">
                {team.number}
              </span>
            </div>
            <p className="text-white font-bold text-sm">{team.name}</p>
          </div>
          <div className="text-xs text-slate-500">
            {team.players.length}p · avg {avgScore}
          </div>
        </div>

        {!isPublished && team.players.length > 0 && (
          <div className="mt-2">
            <Select
              value={team.captainId ?? ""}
              onValueChange={(val) => onCaptainChange(team.id, val)}
            >
              <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-300">
                <SelectValue placeholder="Captain..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {team.players.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-white text-xs">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-orange-400" />
                      {p.nickname ?? p.fullName.split(" ")[0]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="p-2 flex-1 space-y-1.5">
        <SortableContext
          items={team.players.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {team.players.map((player) => (
            <DraggablePlayer
              key={player.id}
              player={player}
              isCaptain={player.id === team.captainId}
            />
          ))}
        </SortableContext>

        {team.players.length === 0 && (
          <div className="flex items-center justify-center h-12 border-2 border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-600 text-xs">Drop here</p>
          </div>
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

  const [localTeams, setLocalTeams] = useState<LocalTeam[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [overTeamId, setOverTeamId] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Fetch teams ──────────────────────────────────────────────
  // ✅ Fix: no onSuccess — use useEffect instead (React Query v5)
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["teams", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/teams`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  // ✅ Fix: sync server data to local state via useEffect
  useEffect(() => {
    if (data?.teams && data.teams.length > 0) {
      setLocalTeams(teamsToLocal(data.teams));
      setIsPublished(data.teams[0]?.isPublished ?? false);
      setIsDirty(false);
    }
  }, [data]);

  // ── Helper: find team by player ──────────────────────────────
  function findTeamByPlayerId(playerId: string): LocalTeam | undefined {
    return localTeams.find((t) => t.players.some((p) => p.id === playerId));
  }

  // ── Mutations ────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/teams`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = localTeams.map((t) => ({
        teamId: t.id,
        playerIds: t.players.map((p) => p.id),
        captainId: t.captainId ?? undefined,
      }));
      const res = await fetch(`/api/admin/games/${gameId}/teams/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams: payload }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Save failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
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
    onSuccess: (d) => {
      toast.success(d.message);
      setIsPublished(true);
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
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
    onSuccess: (d) => {
      toast.success(d.message);
      setSelectedWinner("");
      queryClient.invalidateQueries({ queryKey: ["teams", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── DnD Handlers ────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const playerId = event.active.id as string;
    const team = findTeamByPlayerId(playerId);
    const player = team?.players.find((p) => p.id === playerId);
    if (player) setActivePlayer(player);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (!overId) { setOverTeamId(null); return; }
    const overTeam = localTeams.find((t) => t.id === overId);
    if (overTeam) { setOverTeamId(overTeam.id); return; }
    const byPlayer = findTeamByPlayerId(overId);
    setOverTeamId(byPlayer?.id ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePlayer(null);
    setOverTeamId(null);

    const { active, over } = event;
    if (!over) return;

    const playerId = active.id as string;
    const overId = over.id as string;

    const sourceTeam = findTeamByPlayerId(playerId);
    if (!sourceTeam) return;

    let destTeam = localTeams.find((t) => t.id === overId);
    if (!destTeam) destTeam = findTeamByPlayerId(overId);
    if (!destTeam || sourceTeam.id === destTeam.id) return;

    const player = sourceTeam.players.find((p) => p.id === playerId);
    if (!player) return;

    setLocalTeams((prev) =>
      prev.map((team) => {
        if (team.id === sourceTeam.id) {
          const newPlayers = team.players.filter((p) => p.id !== playerId);
          return {
            ...team,
            players: newPlayers,
            captainId:
              team.captainId === playerId
                ? (newPlayers[0]?.id ?? null)
                : team.captainId,
          };
        }
        if (team.id === destTeam!.id) {
          return { ...team, players: [...team.players, player] };
        }
        return team;
      })
    );
    setIsDirty(true);
  }

  function handleCaptainChange(teamId: string, playerId: string) {
    setLocalTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, captainId: playerId } : t))
    );
    setIsDirty(true);
  }

  function handleReset() {
    if (data?.teams) {
      setLocalTeams(teamsToLocal(data.teams));
      setIsDirty(false);
    }
  }

  function handleGenerate() {
    if (
      localTeams.length === 0 ||
      confirm("This will replace existing teams. Continue?")
    ) {
      generateMutation.mutate();
    }
  }

  const isMutating =
    generateMutation.isPending ||
    saveMutation.isPending ||
    publishMutation.isPending;

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
            <span className="text-white">Teams</span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Trophy className="text-orange-500 h-8 w-8" />
            Team Editor
          </h1>
          <p className="text-slate-400 mt-1">
            Drag players between teams to balance them
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isDirty && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-slate-700 text-slate-400 hover:text-white h-9"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
          {isDirty && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isMutating || isPublished}
            className="border-slate-700 text-slate-300 hover:text-white h-9"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            )}
            {localTeams.length > 0 ? "Regenerate" : "Generate"}
          </Button>
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={
              localTeams.length === 0 || isPublished || isDirty || isMutating
            }
            className="bg-orange-500 hover:bg-orange-600 text-white h-9"
          >
            {publishMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Eye className="h-4 w-4 mr-1.5" />
            )}
            {isPublished ? "Published ✓" : "Publish"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white h-9"
          >
            <Link href={`/admin/games/${gameId}/schedule`}>
              <Calendar className="h-4 w-4 mr-1.5" />
              Schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* Banners */}
      {isPublished && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <Eye className="h-5 w-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm font-medium">
            Teams published — drag & drop is disabled.
          </p>
        </div>
      )}

      {isDirty && !isPublished && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between gap-3">
          <p className="text-blue-400 text-sm font-medium">✏️ Unsaved changes</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="border-slate-700 text-slate-400 h-8"
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && localTeams.length === 0 && (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Users className="h-14 w-14 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 text-lg font-medium">No teams yet</p>
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
            Generate Teams
          </Button>
        </div>
      )}

      {/* DnD Grid */}
      {!isLoading && localTeams.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Teams", value: localTeams.length, icon: Trophy },
              {
                label: "Players",
                value: localTeams.reduce((s, t) => s + t.players.length, 0),
                icon: Users,
              },
              {
                label: "Setters",
                value: localTeams.reduce(
                  (s, t) =>
                    s + t.players.filter((p) => p.skillLevel === "SETTER").length,
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

          {!isPublished && (
            <p className="flex items-center gap-2 text-slate-500 text-sm mb-4">
              <GripVertical className="h-4 w-4" />
              Drag players between teams to reassign them
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {localTeams.map((team) => (
                <TeamColumn
                  key={team.id}
                  team={team}
                  isOver={overTeamId === team.id}
                  isPublished={isPublished}
                  onCaptainChange={handleCaptainChange}
                />
              ))}
            </div>

            <DragOverlay>
              {activePlayer && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800 border border-orange-500/50 shadow-2xl cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-slate-500" />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {activePlayer.fullName[0]}
                  </div>
                  <p className="text-white text-xs font-semibold">
                    {activePlayer.nickname ?? activePlayer.fullName.split(" ")[0]}
                  </p>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Finalize Game */}
          {isPublished && (
            <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Finalize Game Results
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Select the winning team to award +1 ranking point.
              </p>
              <div className="flex gap-3">
                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1">
                    <SelectValue placeholder="Select winning team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {localTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id} className="text-white">
                        {team.name} ({team.players.length} players)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => finalizeMutation.mutate()}
                  disabled={!selectedWinner || finalizeMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {finalizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : "Finalize"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}