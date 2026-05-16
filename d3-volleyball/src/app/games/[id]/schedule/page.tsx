import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Calendar, Trophy } from "lucide-react";

type PageParams = { params: Promise<{ id: string }> };

export default async function PublicSchedulePage({ params }: PageParams) {
  const { id: gameId } = await params;
  const session = await auth();

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { id: true, date: true, schedulePublished: true },
  });

  if (!game || !game.schedulePublished) notFound();

  // Get user's team for highlighting
  let userTeamId: string | null = null;
  if (session?.user?.id) {
    const member = await db.teamMember.findFirst({
      where: { team: { gameId }, userId: session.user.id },
      select: { teamId: true },
    });
    userTeamId = member?.teamId ?? null;
  }

  const matches = await db.match.findMany({
    where: { gameId },
    orderBy: [{ round: "asc" }, { court: "asc" }],
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  // Group by round
  const rounds: Record<number, typeof matches> = {};
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Calendar className="text-orange-500 h-8 w-8" />
            Match Schedule
          </h1>
          <p className="text-slate-400 mt-1">
            {new Date(game.date).toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </p>
          {userTeamId && (
            <p className="text-orange-400 text-sm mt-2">
              🏐 Your matches are highlighted in orange
            </p>
          )}
        </div>

        {/* Rounds */}
        <div className="space-y-6">
          {Object.entries(rounds)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([roundNum, roundMatches]) => (
              <div key={roundNum}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <span className="text-slate-400 text-xs font-black">{roundNum}</span>
                  </div>
                  <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                    Block {roundNum}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roundMatches.map((match) => {
                    const isMyMatch =
                      match.homeTeamId === userTeamId ||
                      match.awayTeamId === userTeamId;

                    return (
                      <div
                        key={match.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isMyMatch
                            ? "bg-orange-500/10 border-orange-500/30"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        {/* Court */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            match.court === 1
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          }`}
                        >
                          Court {match.court}
                        </span>

                        {/* Teams */}
                        <div className="flex items-center justify-between mt-3">
                          <p className={`font-bold text-sm ${
                            match.homeTeamId === userTeamId ? "text-orange-400" : "text-white"
                          }`}>
                            {match.homeTeam.name}
                          </p>
                          <span className="text-slate-600 text-xs font-black mx-2">VS</span>
                          <p className={`font-bold text-sm text-right ${
                            match.awayTeamId === userTeamId ? "text-orange-400" : "text-white"
                          }`}>
                            {match.awayTeam.name}
                          </p>
                        </div>

                        {/* Result */}
                        {match.isCompleted && match.winnerId && (
                          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {match.winnerId === match.homeTeamId
                              ? match.homeTeam.name
                              : match.awayTeam.name}{" "}
                            won
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}