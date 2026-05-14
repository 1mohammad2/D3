import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/section-title';

const stats = [
  { label: 'Players spots', value: '36' },
  { label: 'Weekly games', value: '3' },
  { label: 'Courts', value: '2' },
  { label: 'Teams', value: '6' }
];

const features = [
  { title: 'Smart Registration', description: 'Auto open slots 30 hours before game and manage waiting list automatically.' },
  { title: 'Balanced Teams', description: 'Built for fairness with setter and gender balance in every match.' },
  { title: 'Admin Control', description: 'Approve players, warnings, bans, results, and game schedules from one dashboard.' },
  { title: 'Live Ranking', description: 'Player ratings, leaderboard, and match analytics designed for performance.' }
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-orange-500/15 px-4 py-1 text-sm font-semibold text-orange-200">
                Volleyball community management
              </span>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                D3 - the ultimate volleyball game platform for groups and leagues.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Build schedules, approve players, balance teams, track attendance, and lead every match with modern analytics and sport-first design.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register">
                <Button type="button">Join the squad</Button>
              </Link>
              <Link href="/games">
                <Button variant="ghost" type="button">
                  Game lobby
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="secondary" type="button">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((item) => (
                <Card key={item.label} className="bg-slate-950/90 p-5 text-center">
                  <p className="text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </Card>
              ))}
            </div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow"
          >
            <div className="space-y-6">
              <div className="rounded-3xl bg-gradient-to-br from-orange-500/15 via-transparent to-transparent p-6 text-slate-50">
                <p className="text-sm uppercase tracking-[0.24em] text-orange-300">Next game</p>
                <h2 className="mt-4 text-4xl font-semibold">Wednesday • 8:30 PM</h2>
                <p className="mt-3 text-slate-300">Registration opens automatically 30 hours before the match.</p>
              </div>

              {features.map((feature) => (
                <div key={feature.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
