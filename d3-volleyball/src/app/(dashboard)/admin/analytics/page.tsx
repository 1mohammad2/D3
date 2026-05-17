"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend,
} from "recharts";
import {
  Users, Trophy, Calendar, TrendingUp,
  AlertTriangle, Clock, CheckCircle,
  XCircle, Loader2, BarChart2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type Overview = {
  totalPlayers: number;
  approvedPlayers: number;
  pendingPlayers: number;
  bannedPlayers: number;
  totalGames: number;
  completedGames: number;
  totalRegistrations: number;
  cancelledRegistrations: number;
  totalWaitlist: number;
  attendanceRate: number;
  cancellationRate: number;
  activeWarnings: number;
};

type ChartData = {
  skillDistribution: { name: string; value: number }[];
  genderDistribution: { name: string; value: number }[];
  gamesByMonth: { month: string; games: number; players: number }[];
  topPlayers: {
    name: string;
    score: number;
    games: number;
    wins: number;
    skill: string;
  }[];
};

// ── Color constants ────────────────────────────────────────────
const SKILL_COLORS: Record<string, string> = {
  SETTER: "#f97316",
  ADVANCED: "#a855f7",
  INTERMEDIATE: "#3b82f6",
  BEGINNER: "#22c55e",
};

const GENDER_COLORS = ["#3b82f6", "#ec4899"];

// ── Overview Stat Card ─────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-white",
  bgColor = "bg-slate-900",
  border = "border-slate-800",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bgColor?: string;
  border?: string;
}) {
  return (
    <div className={`${bgColor} border ${border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      {label && <p className="text-slate-300 text-xs font-medium mb-2">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-orange-400" />
      </div>
      <div>
        <h2 className="text-white font-bold">{title}</h2>
        {sub && <p className="text-slate-500 text-xs">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json() as Promise<{ overview: Overview; charts: ChartData }>;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, charts } = data;

  return (
    <div className="p-8 space-y-8">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <BarChart2 className="text-orange-500 h-8 w-8" />
          Analytics
        </h1>
        <p className="text-slate-400 mt-1">
          Platform statistics and performance overview
        </p>
      </div>

      {/* ── Overview Grid ─────────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={TrendingUp}
          title="Platform Overview"
          sub="Key metrics at a glance"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Players"
            value={overview.approvedPlayers}
            sub={`${overview.pendingPlayers} pending`}
            color="text-blue-400"
          />
          <StatCard
            icon={Trophy}
            label="Total Games"
            value={overview.totalGames}
            sub={`${overview.completedGames} completed`}
            color="text-orange-400"
          />
          <StatCard
            icon={CheckCircle}
            label="Attendance Rate"
            value={`${overview.attendanceRate}%`}
            sub="of confirmed players"
            color="text-green-400"
          />
          <StatCard
            icon={XCircle}
            label="Cancellation Rate"
            value={`${overview.cancellationRate}%`}
            sub="of total registrations"
            color="text-red-400"
          />
        </div>
      </div>

      {/* ── Secondary Stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Waitlist Entries"
          value={overview.totalWaitlist}
          color="text-yellow-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Warnings"
          value={overview.activeWarnings}
          color="text-orange-400"
        />
        <StatCard
          icon={XCircle}
          label="Banned Players"
          value={overview.bannedPlayers}
          color="text-red-400"
        />
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={overview.totalRegistrations}
          color="text-purple-400"
        />
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Games Per Month */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <SectionHeader
            icon={Calendar}
            title="Games Per Month"
            sub="Last 6 months activity"
          />
          {charts.gamesByMonth.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.gamesByMonth} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="games"
                  name="Games"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="players"
                  name="Registrations"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Skill Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <SectionHeader
            icon={Users}
            title="Skill Distribution"
            sub="Player levels breakdown"
          />
          {charts.skillDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600">
              No data yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={charts.skillDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.skillDistribution.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={SKILL_COLORS[entry.name] ?? "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {charts.skillDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SKILL_COLORS[entry.name] ?? "#64748b" }}
                      />
                      <span className="text-slate-400 text-sm capitalize">
                        {entry.name.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Players */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <SectionHeader
            icon={Trophy}
            title="Top 5 Players"
            sub="Ranked by performance score"
          />
          {charts.topPlayers.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600">
              No ranked players yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={charts.topPlayers}
                layout="vertical"
                barSize={20}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#e2e8f0", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="score"
                  name="Score"
                  fill="#f97316"
                  radius={[0, 4, 4, 0]}
                >
                  {charts.topPlayers.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={SKILL_COLORS[entry.skill] ?? "#f97316"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <SectionHeader
            icon={Users}
            title="Gender Split"
            sub="Player demographics"
          />
          {charts.genderDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600">
              No data yet
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={charts.genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.genderDistribution.map((_, i) => (
                      <Cell key={i} fill={GENDER_COLORS[i] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex gap-6 mt-2">
                {charts.genderDistribution.map((g, i) => (
                  <div key={g.name} className="text-center">
                    <div
                      className="w-3 h-3 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: GENDER_COLORS[i] }}
                    />
                    <p className="text-white font-black text-xl">{g.value}</p>
                    <p className="text-slate-500 text-xs capitalize">
                      {g.name.toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Summary ────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <SectionHeader
          icon={CheckCircle}
          title="Registration Summary"
          sub="Overall platform activity"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              label: "Confirmed Registrations",
              value: overview.totalRegistrations,
              color: "bg-green-500",
              pct: 100,
            },
            {
              label: "Cancellations",
              value: overview.cancelledRegistrations,
              color: "bg-red-500",
              pct: overview.cancellationRate,
            },
            {
              label: "Waitlist Entries",
              value: overview.totalWaitlist,
              color: "bg-orange-500",
              pct: Math.min(
                overview.totalRegistrations > 0
                  ? Math.round((overview.totalWaitlist / overview.totalRegistrations) * 100)
                  : 0,
                100
              ),
            },
          ].map(({ label, value, color, pct }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">{label}</p>
                <p className="text-white font-black">{value}</p>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}