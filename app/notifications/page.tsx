import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';
import { NotificationCard } from '@/components/notifications/notification-card';
import { redirect } from 'next/navigation';

export default async function NotificationsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <SectionTitle title="Notifications" subtitle="Your latest platform messages and waiting list updates." />

        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-orange-300">Inbox</p>
              <h2 className="text-2xl font-semibold text-white">{notifications.length} alerts</h2>
            </div>
            <Link href="/games">
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Back to games</button>
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-slate-400">
              No notifications yet. Your confirmations, waiting list updates, and admin alerts will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  id={notification.id}
                  title={notification.title}
                  message={notification.message}
                  type={notification.type}
                  read={notification.read}
                  timestamp={notification.createdAt.toISOString()}
                  onMarkRead={async () => {
                    await fetch('/api/notifications/read', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notificationId: notification.id })
                    });
                    window.location.reload();
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
