import { Suspense } from "react";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { CountdownTimer } from "@/components/home/countdown-timer";
import { Button } from "@/components/ui/button";
import {
  Trophy, Users, Calendar, ChevronRight,
  Zap, Clock, CheckCircle
} from "lucide-react";

// Fetch home data from our API
async function getHomeData() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/home`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Skill level color mapping
const skillColors: Record<string, string> = {
  BEGINNER: "text-green-400 bg-green-400/10",
  INTERMEDIATE: "text-blue-400 bg-blue-400/10",
  ADVANCED: "text-purple-400 bg-purple-400/10",
  SETTER: "text-orange-400 bg-orange-400/10",
};

// Rank badge for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold">
      {rank}
    </span>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const tSkill = await getTranslations("skillLevel");
  const locale = await getLocale();
  const data = await getHomeData();

  const { nextGame, topPlayers = [], stats = {} } = data ?? {};

  const now = new Date();
  const registrationOpen = nextGame?.status === "REGISTRATION_OPEN";
  const gameIsFull = nextGame?.status === "FULL";
  const registrationNotYetOpen =
    nextGame && new Date(nextGame.registrationOpensAt) > now;

  // Determine countdown target
  const countdownTarget = registrationNotYetOpen
    ? nextGame.registrationOpensAt
    : nextGame?.date;

  const countdownLabel = registrationNotYetOpen
    ? t("registrationOpensIn")
    : t("gameStartsIn");

  return (
    <div className="min-h-screen bg-slate-950" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Navbar />

      {/* ── HERO SECTION ────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        {/* Animated background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 60px, #fff 60px, #fff 61px),
              repeating-linear-gradient(90deg, transparent, transparent 60px, #fff 60px, #fff 61px)
            `,
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Volleyball emoji with pulse */}
          <div className="text-7xl mb-6 inline-block animate-pulse-slow">🏐</div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-none mb-4">
            D<span className="text-orange-500">3</span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-300 font-light mb-3">
            {t("heroSubtitle")}
          </p>

          <p className="text-slate-500 text-base mb-10">{tCommon("tagline")}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-lg rounded-xl"
            >
              <Link href="/register">{t("registerNow")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 px-8 py-6 text-lg rounded-xl"
            >
              <Link href="/games">{t("viewGames")}</Link>
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-slate-700 rounded-full flex justify-center pt-2">
              <div className="w-1 h-3 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── NEXT GAME CARD ───────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-10 flex items-center justify-center gap-3">
            <Calendar className="text-orange-500 h-8 w-8" />
            {t("nextGame")}
          </h2>

          {nextGame ? (
            <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm overflow-hidden">

              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-blue-500/5 pointer-events-none" />

              {/* Game date */}
              <div className="text-center mb-8">
                <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">
                  {new Date(nextGame.date).toLocaleDateString(
                    locale === "ar" ? "ar-AE" : "en-US",
                    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
                <p className="text-white text-xl font-semibold">
                  {new Date(nextGame.date).toLocaleTimeString(
                    locale === "ar" ? "ar-AE" : "en-US",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </p>
              </div>

              {/* Status Badge */}
              {registrationOpen && (
                <div className="flex justify-center mb-6">
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-semibold animate-pulse">
                    <Zap className="h-4 w-4" />
                    {t("registrationOpen")}
                  </span>
                </div>
              )}

              {/* Countdown */}
              {!gameIsFull && countdownTarget && (
                <div className="mb-8">
                  <p className="text-slate-400 text-sm text-center mb-4 uppercase tracking-wider">
                    {countdownLabel}
                  </p>
                  <CountdownTimer targetDate={countdownTarget} />
                </div>
              )}

              {/* Spots Counter */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700/50">
                  <p className="text-3xl font-black text-white">
                    {gameIsFull ? "0" : nextGame.availableSpots}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {gameIsFull ? t("spotsFull") : t("spotsAvailable")}
                  </p>

                  {/* Spots progress bar */}
                  <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${(nextGame.confirmedCount / nextGame.maxPlayers) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {nextGame.confirmedCount}/{nextGame.maxPlayers}
                  </p>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700/50">
                  <p className="text-3xl font-black text-orange-400">
                    {nextGame.waitingCount}
                  </p>
                  <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t("waitingList")}
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 text-base rounded-xl"
              >
                <Link href="/games">
                  {gameIsFull ? t("joinWaitlist") : t("registerSpot")}
                  <ChevronRight className="h-5 w-5 ms-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noUpcomingGame")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── LEADERBOARD PREVIEW ───────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Trophy className="text-orange-500 h-8 w-8" />
                {t("leaderboardTitle")}
              </h2>
              <p className="text-slate-400 text-sm mt-1">{t("leaderboardSubtitle")}</p>
            </div>
            <Link
              href="/leaderboard"
              className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1"
            >
              {tCommon("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {topPlayers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No rankings yet</p>
              </div>
            ) : (
              topPlayers.map((player: {
                id: string;
                fullName: string;
                nickname: string | null;
                rankingScore: number;
                gamesPlayed: number;
                skillLevel: string;
              }, index: number) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors
                    ${index === 0
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 flex items-center justify-center w-10">
                    <RankBadge rank={index + 1} />
                  </div>

                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {player.fullName[0]}
                  </div>

                  {/* Name + Skill */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {player.fullName}
                      {player.nickname && (
                        <span className="text-slate-400 font-normal text-sm ms-1">
                          ({player.nickname})
                        </span>
                      )}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${skillColors[player.skillLevel]}`}>
                      {tSkill(player.skillLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "SETTER")}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-orange-400 font-black text-xl">{player.rankingScore}</p>
                    <p className="text-slate-500 text-xs">{player.gamesPlayed} {t("games")}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── PLATFORM STATS ────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-10">
            {t("statsTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, label: t("totalPlayers"), value: stats.totalPlayers ?? 0, color: "text-blue-400" },
              { icon: CheckCircle, label: t("totalGames"), value: stats.totalGames ?? 0, color: "text-green-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center"
              >
                <Icon className={`h-8 w-8 mx-auto mb-3 ${color}`} />
                <p className="text-4xl font-black text-white">{value}</p>
                <p className="text-slate-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>
          D<span className="text-orange-500">3</span> Volleyball © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}