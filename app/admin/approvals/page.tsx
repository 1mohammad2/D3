import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { ApprovalActions } from '@/components/admin/approval-actions';
import { redirect } from 'next/navigation';

export default async function AdminApprovalsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const pendingUsers = await prisma.user.findMany({
    where: { approved: false, role: 'PLAYER' },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <SectionTitle
          title="Player approvals"
          subtitle="Review new player registrations and approve or reject them before they can use D3."
        />

        <Card className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-orange-300">Pending signups</p>
                <h2 className="text-2xl font-semibold text-white">{pendingUsers.length} player requests</h2>
              </div>
              <Button onClick={() => window.location.assign('/')} size="sm">
                Return to home
              </Button>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-8 text-slate-300">
                No pending approvals yet. New registrations will appear here automatically.
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{user.name}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <p className="mt-2 text-sm text-slate-500">{user.phone || 'Phone not provided'}</p>
                      </div>
                      <ApprovalActions userId={user.id} />
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                        <span className="font-semibold text-white">Skill</span>
                        <p className="mt-1">{user.skillLevel}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                        <span className="font-semibold text-white">Gender</span>
                        <p className="mt-1">{user.gender}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                        <span className="font-semibold text-white">Setter</span>
                        <p className="mt-1">{user.setterStatus ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
