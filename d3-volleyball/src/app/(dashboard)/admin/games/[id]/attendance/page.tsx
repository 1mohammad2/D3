"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
  Users, Check, X, AlertTriangle,
  Loader2, CheckCircle, XCircle,
  HelpCircle, Zap, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
type PlayerReg = {
  id: string;
  attended: boolean | null;
  isLateCancellation: boolean;
  user: {
    id: string;
    fullName: string;
    nickname: string | null;
    skillLevel: string;
    gender: string;
    warningCount: number;
    isBanned: boolean;
  };
};

type Summary = {
  total: number;
  attended: number;
  absent: number;
  unmarked: number;
};

// ── Skill Colors ───────────────────────────────────────────────
const SKILL_COLORS: Record<string, string> = {
  SETTER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ADVANCED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  INTERMEDIATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BEGINNER: "bg-green-500/20 text-green-400 border-green-500/30",
};

// ── Attendance Status Icon ─────────────────────────────────────
function AttendanceIcon({ attended }: { attended: boolean | null }) {
  if (attended === true) {
    return <CheckCircle className="h-5 w-5 text-green-400" />;
  }
  if (attended === false) {
    return <XCircle className="h-5 w-5 text-red-400" />;
  }
  return <HelpCircle className="h-5 w-5 text-slate-600" />;
}

// ── Player Row ─────────────────────────────────────────────────
function PlayerRow({
  reg,
  onMark,
  isLoading,
}: {
  reg: PlayerReg;
  onMark: (regId: string, attended: boolean) => void;
  isLoading: boolean;
}) {
  const isAttended = reg.attended === true;
  const isAbsent = reg.attended === false;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        isAttended
          ? "bg-green-500/5 border-green-500/20"
          : isAbsent
          ? "bg-red-500/5 border-red-500/20"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* Status icon */}
      <AttendanceIcon attended={reg.attended} />

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {reg.user.fullName[0]}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold text-sm">
            {reg.user.fullName}
          </p>
          {reg.user.nickname && (
            <span className="text-slate-500 text-xs">
              ({reg.user.nickname})
            </span>
          )}
          {reg.user.gender === "FEMALE" && (
            <span className="text-pink-400 text-xs">♀</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
              SKILL_COLORS[reg.user.skillLevel]
            }`}
          >
            {reg.user.skillLevel}
          </span>
          {reg.user.warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              {reg.user.warningCount} warning{reg.user.warningCount > 1 ? "s" : ""}
            </span>
          )}
          {reg.user.isBanned && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Banned
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => onMark(reg.id, true)}
          disabled={isLoading || isAttended}
          className={`h-8 px-3 text-xs font-semibold ${
            isAttended
              ? "bg-green-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-green-600 hover:text-white border border-slate-700"
          }`}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Present
        </Button>
        <Button
          size="sm"
          onClick={() => onMark(reg.id, false)}
          disabled={isLoading || isAbsent}
          className={`h-8 px-3 text-xs font-semibold ${
            isAbsent
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white border border-slate-700"
          }`}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Absent
        </Button>
      </div>
    </div>
  );
}

// ── Summary Bar ────────────────────────────────────────────────
function SummaryBar({ summary }: { summary: Summary }) {
  const total = summary.total || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total", value: summary.total, color: "text-white" },
          { label: "Present", value: summary.attended, color: "text-green-400" },
          { label: "Absent", value: summary.absent, color: "text-red-400" },
          { label: "Unmarked", value: summary.unmarked, color: "text-slate-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${(summary.attended / total) * 100}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${(summary.absent / total) * 100}%` }}
        />
        <div
          className="bg-slate-700 transition-all duration-500"
          style={{ width: `${(summary.unmarked / total) * 100}%` }}
        />
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" /> Present
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-slate-700" /> Unmarked
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AttendancePage() {
  const params = useParams();
  const gameId = params.id as string;
  const queryClient = useQueryClient();
  const [warningResult, setWarningResult] = useState<{
    warned: number;
    autoBanned: number;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/attendance`);
      if (!res.ok) throw new Error("Failed to load attendance");
      return res.json();
    },
  });

  const markMutation = useMutation({
    mutationFn: async ({
      registrationId,
      attended,
    }: {
      registrationId: string;
      attended: boolean;
    }) => {
      const res = await fetch(`/api/admin/games/${gameId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark",
          registrationId,
          attended,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markAllMutation = useMutation({
    mutationFn: async (allPresent: boolean) => {
      const regs: PlayerReg[] = data?.registrations ?? [];
      const ids = regs.map((r: PlayerReg) => r.id);
      const res = await fetch(`/api/admin/games/${gameId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_mark",
          attendedIds: allPresent ? ids : [],
          absentIds: allPresent ? [] : ids,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      queryClient.invalidateQueries({ queryKey: ["attendance", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const warnMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/games/${gameId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_warnings" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      setWarningResult({ warned: d.warned, autoBanned: d.autoBanned });
      queryClient.invalidateQueries({ queryKey: ["attendance", gameId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regs: PlayerReg[] = data?.registrations ?? [];
  const summary: Summary = data?.summary ?? {
    total: 0,
    attended: 0,
    absent: 0,
    unmarked: 0,
  };
  const absentCount = regs.filter((r) => r.attended === false).length;
  const isMutating =
    markMutation.isPending ||
    markAllMutation.isPending ||
    warnMutation.isPending;

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
            <span className="text-white">Attendance</span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Users className="text-orange-500 h-8 w-8" />
            Attendance
          </h1>
          {data?.game && (
            <p className="text-slate-400 mt-1">
              {new Date(data.game.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              · {data.game.venue}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate(true)}
            disabled={isMutating}
            className="border-green-800 text-green-400 hover:bg-green-500/10 h-9"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate(false)}
            disabled={isMutating}
            className="border-red-900 text-red-400 hover:bg-red-500/10 h-9"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            All Absent
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Summary bar */}
          <SummaryBar summary={summary} />

          {/* Warning result banner */}
          {warningResult && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-orange-400 shrink-0" />
                <div>
                  <p className="text-orange-400 font-semibold text-sm">
                    Warnings Applied
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {warningResult.warned} players warned
                    {warningResult.autoBanned > 0 && (
                      <span className="text-red-400 ml-1">
                        · {warningResult.autoBanned} auto-banned
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {regs.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Users className="h-14 w-14 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-400 text-lg font-medium">
                No registered players
              </p>
            </div>
          ) : (
            <>
              {/* Players list */}
              <div className="space-y-2 mb-8">
                {regs.map((reg) => (
                  <PlayerRow
                    key={reg.id}
                    reg={reg}
                    onMark={(regId, attended) =>
                      markMutation.mutate({ registrationId: regId, attended })
                    }
                    isLoading={isMutating}
                  />
                ))}
              </div>

              {/* Apply Warnings section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">Apply Warnings</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Issue automatic warnings to all absent players.
                      {absentCount > 0 ? (
                        <span className="text-orange-400 font-medium ml-1">
                          {absentCount} player{absentCount > 1 ? "s" : ""} marked absent.
                        </span>
                      ) : (
                        <span className="text-slate-500 ml-1">
                          No absent players yet.
                        </span>
                      )}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      ⚠️ Players with 2+ warnings will be automatically
                      banned for {7} days.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (
                        confirm(
                          `Issue warnings to ${absentCount} absent player(s)? This cannot be undone.`
                        )
                      ) {
                        warnMutation.mutate();
                      }
                    }}
                    disabled={absentCount === 0 || isMutating}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shrink-0"
                  >
                    {warnMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Apply Warnings
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}