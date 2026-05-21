import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Calendar, BarChart3, ArrowLeft } from "lucide-react";

type PageParams = { params: Promise<{ id: string }> };

export default async function AdminGameDetailPage({ params }: PageParams) {
  const { id: gameId } = await params;

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      date: true,
      status: true,
      venue: true,
      maxPlayers: true,
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
        },
      },
    },
  });

  if (!game) notFound();

  const subPages = [
    {
      href: `/admin/games/${gameId}/attendance`,
      label: "Attendance",
      description: "Mark who showed up",
      icon: Users,
    },
    {
      href: `/admin/games/${gameId}/teams`,
      label: "Teams",
      description: "Generate & publish teams",
      icon: BarChart3,
    },
    {
      href: `/admin/games/${gameId}/schedule`,
      label: "Schedule",
      description: "Create match schedule",
      icon: Calendar,
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/admin/games"
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Games
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Game Management</h1>
        <p className="text-slate-400 mt-1">
          {new Date(game.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          · {game.venue ?? "Main Court"} ·{" "}
          {game._count.registrations}/{game.maxPlayers} players
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {subPages.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 hover:bg-slate-900/80 transition-all flex flex-col items-center gap-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}