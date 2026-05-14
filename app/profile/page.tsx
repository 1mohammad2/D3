import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    redirect('/auth/signin');
  }

  const statusLabel = user.approved ? 'Approved' : 'Awaiting approval';

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <SectionTitle
          title="Player profile"
          subtitle="Your D3 account details and player status are managed here."
        />

        <Card className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{user.name}</h2>
                    <p className="mt-2 text-sm text-slate-400">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200">
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Phone</p>
                    <p className="mt-2 text-lg text-slate-100">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Skill level</p>
                    <p className="mt-2 text-lg text-slate-100">{user.skillLevel}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Games played</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{user.gamesPlayed}</p>
                </Card>
                <Card>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Ranking score</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{Math.round(user.rankingScore)}</p>
                </Card>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6">
              <h3 className="text-lg font-semibold text-white">Player stats</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Wins: {user.wins}</p>
                <p>Losses: {user.losses}</p>
                <p>Warnings: {user.warnings}</p>
                <p>Late cancellations: {user.lateCancellations}</p>
                <p>MVP count: {user.mvpCount}</p>
                <p>Setter status: {user.setterStatus ? 'Active setter' : 'Regular player'}</p>
              </div>
            </div>
          </div>

          {!user.approved ? (
            <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-6 text-orange-100">
              Your account is waiting for admin approval. Once approved, you will receive a notification and can sign in.
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 text-slate-300">
              You are approved. Play smart, keep your attendance high, and watch your ranking score climb.
            </div>
          )}
        </Card>

        <Button onClick={() => window.location.assign('/')}>Back to home</Button>
      </div>
    </main>
  );
}
