import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { GameRegistrationActions } from '@/components/games/game-registration-actions';
import { redirect } from 'next/navigation';

export default async function GamesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }

  const games = await prisma.game.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    take: 6,
    include: {
      _count: { select: { registrations: true } }
    }
  });

  const registrations = await prisma.registration.findMany({
    where: {
      userId: session.user.id,
      gameId: { in: games.map((game) => game.id) },
      status: 'CONFIRMED'
    }
  });

  const registeredGameIds = registrations.map((registration) => registration.gameId);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionTitle
              title="Upcoming games"
              subtitle="See the next volleyball events and reserve your spot as soon as registration opens."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Back to home
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                My profile
              </Button>
            </Link>
          </div>
        </div>

        {games.length === 0 ? (
          <Card className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-slate-300">
            No games are scheduled yet. Ask your admin to add the next matches and create the weekly roster.
          </Card>
        ) : (
          <div className="space-y-6">
            {games.map((game) => {
              const isRegistered = registeredGameIds.includes(game.id);
              const spotsLeft = Math.max(0, 36 - game._count.registrations);
              return (
                <Card key={game.id} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-orange-300">Game event</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">{game.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                    <p className="mt-3 text-slate-300">Starts at {game.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} on Court 1 and Court 2.</p>
                    <p className="mt-2 text-sm text-slate-500">Registration opens {game.openAt.toLocaleString()} and cancellation closes {game.closeAt.toLocaleString()}.</p>
                  </div>
                  <GameRegistrationActions
                    gameId={game.id}
                    gameDate={game.date.toISOString()}
                    openAt={game.openAt.toISOString()}
                    closeAt={game.closeAt.toISOString()}
                    spotsLeft={spotsLeft}
                    isRegistered={isRegistered}
                  />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
