import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import Link from "next/link";
import { Calendar, Users, MapPin, Trophy } from "lucide-react";

type PageParams = { params: Promise<{ id: string }> };

export default async function GameDetailPage({ params }: PageParams) {
  const { id: gameId } = await params;
  const session = await auth();

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      date: true,
      status: true,
      venue: true,
      maxPlayers: true,
      teamsPublished: true,
      schedulePublished: true,
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
          waitingList: { where: { isPromoted: false } },
        },
      },
    },
  });

  if (!game) notFound();

  const confirmedCount = game._count.registrations;
  const waitingCount = game._count.waitingList;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">

        <div>
          <h1 className="text-3xl font-black text-white">Game Details</h1>
          <p className="text-slate-400 mt-1">
            {new Date(game.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-300">
            <Calendar className="h-5 w-5 text-orange-400 shrink-0" />
            <span>
              {new Date(game.date).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <MapPin className="h-5 w-5 text-orange-400 shrink-0" />
            <span>{game.venue ?? "Main Court"}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Users className="h-5 w-5 text-orange-400 shrink-0" />
            <span>
              {confirmedCount} / {game.maxPlayers} players registered
              {waitingCount > 0 && (
                <span className="ml-2 text-yellow-400 text-sm">
                  ({waitingCount} on waitlist)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Show schedule link only when published */}
        {game.schedulePublished && (
          <Link
            href={`/games/${gameId}/schedule`}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Trophy className="h-5 w-5" />
            View Match Schedule
          </Link>
        )}

        <Link
          href="/games"
          className="block text-center text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Back to all games
        </Link>
      </div>
    </div>
  );
}