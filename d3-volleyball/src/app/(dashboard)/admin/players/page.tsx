"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, AlertTriangle, Ban, ShieldOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────
type Player = {
  id: string;
  fullName: string;
  nickname: string | null;
  email: string;
  gender: string;
  skillLevel: string;
  isApproved: boolean;
  isBanned: boolean;
  warningCount: number;
  rankingScore: number;
  gamesPlayed: number;
  createdAt: string;
  bans: { reason: string; endsAt: string }[];
  warnings: { id: string; reason: string; issuedAt: string }[];
};

type ActionType = "approve" | "reject" | "warn" | "ban" | "unban";

// ─── API Functions ────────────────────────────────────────────
async function fetchPlayers(): Promise<{ players: Player[] }> {
  const res = await fetch("/api/admin/players");
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
}

async function playerAction(
  id: string,
  action: string,
  reason?: string
): Promise<{ message: string }> {
  const res = await fetch(`/api/admin/players/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Action failed");
  return data;
}

// ─── Skill Level Badge ────────────────────────────────────────
function SkillBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    BEGINNER: "bg-green-500/20 text-green-400 border-green-500/30",
    INTERMEDIATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    ADVANCED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    SETTER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[level] ?? ""}`}>
      {level}
    </span>
  );
}

// ─── Player Row ───────────────────────────────────────────────
function PlayerRow({
  player,
  onAction,
  isLoading,
}: {
  player: Player;
  onAction: (id: string, action: ActionType) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-semibold">
              {player.fullName}
              {player.nickname && (
                <span className="text-slate-400 font-normal ml-1">
                  ({player.nickname})
                </span>
              )}
            </p>
            <p className="text-slate-400 text-sm">{player.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <SkillBadge level={player.skillLevel} />
          <span className="text-slate-500 text-xs">{player.gender}</span>
          {player.warningCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
              ⚠️ {player.warningCount} warning(s)
            </span>
          )}
          {player.isBanned && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
              🚫 Banned
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-4">
        {!player.isApproved && (
          <>
            <Button
              size="sm"
              onClick={() => onAction(player.id, "approve")}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white h-8"
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onAction(player.id, "reject")}
              disabled={isLoading}
              className="h-8"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
          </>
        )}
        {player.isApproved && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(player.id, "warn")}
              disabled={isLoading}
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-500/10 h-8"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Warn
            </Button>
            {player.isBanned ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(player.id, "unban")}
                disabled={isLoading}
                className="border-green-600 text-green-400 hover:bg-green-500/10 h-8"
              >
                <ShieldOff className="h-3.5 w-3.5 mr-1" /> Unban
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(player.id, "ban")}
                disabled={isLoading}
                className="border-red-600 text-red-400 hover:bg-red-500/10 h-8"
              >
                <Ban className="h-3.5 w-3.5 mr-1" /> Ban
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function AdminPlayersPage() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{
    open: boolean;
    playerId: string;
    action: ActionType;
    playerName: string;
  } | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-players"],
    queryFn: fetchPlayers,
  });

  const mutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      playerAction(id, action, reason),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });
      setDialog(null);
      setReason("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleAction = (playerId: string, action: ActionType, playerName = "") => {
    // Approve doesn't need confirmation dialog
    if (action === "approve") {
      mutation.mutate({ id: playerId, action });
      return;
    }
    setDialog({ open: true, playerId, action, playerName });
  };

  const confirmAction = () => {
    if (!dialog) return;
    const needsReason = ["warn", "ban", "reject"].includes(dialog.action);
    if (needsReason && !reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    mutation.mutate({
      id: dialog.playerId,
      action: dialog.action,
      reason: reason.trim() || undefined,
    });
  };

  const players = data?.players ?? [];
  const pending = players.filter((p) => !p.isApproved);
  const approved = players.filter((p) => p.isApproved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Player Management</h1>
        <p className="text-slate-400 mt-1">Approve, warn, or ban players</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-slate-900 border border-slate-800 mb-6">
          <TabsTrigger value="pending" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            Pending Approval ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            All Players ({approved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              ✅ No pending approvals
            </div>
          ) : (
            pending.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onAction={(id, action) => handleAction(id, action, player.fullName)}
                isLoading={mutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {approved.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No approved players yet
            </div>
          ) : (
            approved.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onAction={(id, action) => handleAction(id, action, player.fullName)}
                isLoading={mutation.isPending}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialog?.open ?? false} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white capitalize">
              {dialog?.action} Player
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {dialog?.action === "reject" && "This will permanently delete the registration."}
              {dialog?.action === "warn" && `Issuing a warning to ${dialog.playerName}. After 2 warnings they will be auto-banned.`}
              {dialog?.action === "ban" && `Banning ${dialog.playerName} for 7 days.`}
              {dialog?.action === "unban" && `This will lift the ban for ${dialog.playerName}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {["warn", "ban", "reject"].includes(dialog?.action ?? "") && (
            <Textarea
              placeholder="Reason (required)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-2"
              rows={3}
            />
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setDialog(null); setReason(""); }}
              className="border-slate-700 text-slate-400"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={mutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
