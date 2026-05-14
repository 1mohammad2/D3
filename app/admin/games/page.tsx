import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { GameCreateForm } from '@/components/admin/game-create-form';
import { redirect } from 'next/navigation';

export default async function AdminGamesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const games = await prisma.game.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    include: {
      registrations: {
        where: { status: 'CONFIRMED' },
        select: { id: true }
      }
    }
  });

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle title="Admin games" subtitle="Create the next volleyball sessions and watch registration capacity in real time." />
          <Link href="/admin/approvals">
            <Button size="sm">Go to approvals</Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <Card className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Create new game</h3>
            <GameCreateForm />
          </Card>

          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-orange-300">Upcoming schedule</p>
                <h2 className="text-2xl font-semibold text-white">{games.length} scheduled games</h2>
              </div>
              <Link href="/games">
                <Button variant="ghost" size="sm">
                  View games
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {games.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-300">
                  No scheduled games. Use the form to add the first Wednesday, Friday, or Sunday event.
                </div>
              ) : (
                games.map((game) => (
                  <div key={game.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{game.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-slate-400">Starts at {game.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                        {game.registrations.length} / 36 registered
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
