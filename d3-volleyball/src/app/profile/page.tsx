"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Trophy, Star, Target, Calendar,
  Edit2, Save, X, Loader2,
  Shield, TrendingUp, CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getRankColor, getRankLabel, calculateWinRate } from "@/lib/ranking";

// ── Types ──────────────────────────────────────────────────────
type ProfileData = {
  user: {
    id: string;
    fullName: string;
    nickname: string | null;
    email: string;
    phone: string | null;
    gender: string;
    skillLevel: string;
    rankingScore: number;
    rankingPoints: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    mvpCount: number;
    warningCount: number;
    isBanned: boolean;
    isApproved: boolean;
    createdAt: string;
  };
  recentGames: {
    registeredAt: string;
    attended: boolean | null;
    game: { id: string; date: string; status: string; venue: string };
  }[];
  rankPosition: number;
  winRate: number;
};

const SKILL_COLORS: Record<string, string> = {
  SETTER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ADVANCED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  INTERMEDIATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BEGINNER: "bg-green-500/20 text-green-400 border-green-500/30",
};

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-white",
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
      {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Edit Profile Form ──────────────────────────────────────────
function EditForm({
  user,
  onSave,
  onCancel,
  saving,
}: {
  user: ProfileData["user"];
  onSave: (data: { fullName: string; nickname: string; phone: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    nickname: user.nickname ?? "",
    phone: user.phone ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Full Name</Label>
        <Input
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Nickname (optional)</Label>
        <Input
          value={form.nickname}
          onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
          placeholder="Your nickname..."
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Phone Number</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+971..."
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.fullName.trim()}
          className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-slate-700 text-slate-400"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json() as Promise<ProfileData>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: {
      fullName: string;
      nickname: string;
      phone: string;
    }) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Update failed");
      return result;
    },
    onSuccess: (d) => {
      toast.success(d.message);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!data) return null;

  const { user, recentGames, rankPosition, winRate } = data;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        {/* ── Profile Header ──────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shrink-0">
              {user.fullName[0]}
            </div>

            {/* Info */}
            <div className="flex-1">
              {!editing ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-white">
                        {user.fullName}
                      </h1>
                      {user.nickname && (
                        <p className="text-slate-400 text-sm">
                          "{user.nickname}"
                        </p>
                      )}
                      <p className="text-slate-500 text-sm mt-1">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-slate-500 text-sm">{user.phone}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="border-slate-700 text-slate-400 hover:text-white shrink-0"
                    >
                      <Edit2 className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${SKILL_COLORS[user.skillLevel]}`}>
                      {user.skillLevel}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 text-slate-400 border-slate-700">
                      {user.gender}
                    </span>
                    {user.isBanned && (
                      <span className="text-xs px-2.5 py-1 rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
                        🚫 Banned
                      </span>
                    )}
                    {user.warningCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        ⚠️ {user.warningCount} warning{user.warningCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className={`text-xs font-bold ${getRankColor(user.rankingScore)}`}>
                      {getRankLabel(user.rankingScore)}
                    </span>
                  </div>

                  {/* Member since */}
                  <p className="text-slate-600 text-xs mt-2">
                    Member since{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </>
              ) : (
                <EditForm
                  user={user}
                  onSave={(data) => updateMutation.mutate(data)}
                  onCancel={() => setEditing(false)}
                  saving={updateMutation.isPending}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Ranking Card ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-orange-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
                Ranking Score
              </p>
              <p className={`text-5xl font-black ${getRankColor(user.rankingScore)}`}>
                {user.rankingScore}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                #{rankPosition} overall · {user.rankingPoints} total points
              </p>
            </div>
            <div className="text-6xl">
              {rankPosition === 1 ? "🥇" : rankPosition === 2 ? "🥈" : rankPosition === 3 ? "🥉" : "🏐"}
            </div>
          </div>

          {/* Score progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>0</span>
              <span>100</span>
            </div>
            <Progress
              value={Math.min(user.rankingScore, 100)}
              className="h-2 bg-slate-800"
            />
          </div>
        </div>

        {/* ── Stats Grid ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Calendar}
            label="Games Played"
            value={user.gamesPlayed}
            color="text-blue-400"
          />
          <StatCard
            icon={Trophy}
            label="Wins"
            value={user.wins}
            color="text-green-400"
            sub={`${winRate}% win rate`}
          />
          <StatCard
            icon={Target}
            label="Losses"
            value={user.losses}
            color="text-red-400"
          />
          <StatCard
            icon={Star}
            label="MVP"
            value={user.mvpCount}
            color="text-yellow-400"
          />
        </div>

        {/* ── Win Rate Bar ─────────────────────────────────── */}
        {user.gamesPlayed > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <p className="text-white font-semibold">Performance</p>
              </div>
              <p className="text-orange-400 font-black">{winRate}%</p>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${winRate}%` }}
              />
              <div
                className="bg-red-500/60 transition-all"
                style={{ width: `${100 - winRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1.5">
              <span>{user.wins} wins</span>
              <span>{user.losses} losses</span>
            </div>
          </div>
        )}

        {/* ── Recent Games ─────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <h2 className="text-white font-bold">Recent Games</h2>
          </div>

          {recentGames.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No games played yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentGames.map((reg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {new Date(reg.game.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {reg.game.venue} ·{" "}
                      {new Date(reg.game.date).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reg.attended === true && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Attended
                      </span>
                    )}
                    {reg.attended === false && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Missed
                      </span>
                    )}
                    {reg.attended === null && (
                      <span className="text-xs text-slate-500">Registered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}