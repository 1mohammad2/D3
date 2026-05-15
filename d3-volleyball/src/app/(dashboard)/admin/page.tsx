import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Users, Clock, Ban, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Admin Dashboard Home — shows quick stats.
 * Server Component — fetches data directly, no API needed.
 */
export default async function AdminDashboardPage() {
  const session = await auth();

  // Fetch stats in parallel for performance
  const [totalPlayers, pendingPlayers, bannedPlayers, totalGames] =
    await Promise.all([
      db.user.count({ where: { role: "PLAYER", isApproved: true } }),
      db.user.count({ where: { role: "PLAYER", isApproved: false } }),
      db.user.count({ where: { role: "PLAYER", isBanned: true } }),
      db.game.count(),
    ]);

  const stats = [
    {
      label: "Total Players",
      value: totalPlayers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pending Approval",
      value: pendingPlayers,
      icon: Clock,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Banned Players",
      value: bannedPlayers,
      icon: Ban,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Total Games",
      value: totalGames,
      icon: Trophy,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">
          Welcome, {session?.user?.name} 👋
        </h1>
        <p className="text-slate-400 mt-1">D3 Volleyball Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium">
                {label}
              </CardTitle>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Action */}
      {pendingPlayers > 0 && (
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-orange-400 font-medium">
            ⚠️ {pendingPlayers} player(s) waiting for your approval.{" "}
            <a href="/admin/players" className="underline hover:text-orange-300">
              Review now →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
