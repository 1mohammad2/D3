import { GAME_CONFIG } from "@/lib/constants";

// ── Define types separately — avoids multiline generic issues ──
type StatusConfig = {
  label: string;
  labelAr: string;
  color: string;
  dot: string;
};

// ── Calculate when registration opens ──────────────────────────
export function getRegistrationOpensAt(gameDate: Date): Date {
  const opensAt = new Date(gameDate);
  opensAt.setHours(
    opensAt.getHours() - GAME_CONFIG.REGISTRATION_OPENS_HOURS_BEFORE
  );
  return opensAt;
}

// ── Compute real-time game status ──────────────────────────────
export function computeGameStatus(
  gameDate: Date,
  registrationOpensAt: Date,
  confirmedCount: number,
  maxPlayers: number
): string {
  const now = new Date();

  if (now > gameDate) {
    const gameEndTime = new Date(gameDate);
    gameEndTime.setHours(gameEndTime.getHours() + 4);
    return now < gameEndTime ? "IN_PROGRESS" : "COMPLETED";
  }

  if (now < registrationOpensAt) return "UPCOMING";
  if (confirmedCount >= maxPlayers) return "FULL";
  return "REGISTRATION_OPEN";
}

// ── Can player cancel? (must be > 4 hours before game) ─────────
export function canCancelRegistration(gameDate: Date): boolean {
  const hoursUntilGame =
    (gameDate.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntilGame > GAME_CONFIG.CANCELLATION_DEADLINE_HOURS;
}

// ── Is registration window open right now? ─────────────────────
export function isRegistrationOpen(
  gameDate: Date,
  registrationOpensAt: Date,
  confirmedCount: number,
  maxPlayers: number
): boolean {
  const status = computeGameStatus(
    gameDate,
    registrationOpensAt,
    confirmedCount,
    maxPlayers
  );
  return status === "REGISTRATION_OPEN";
}

// ── Status badge config for UI components ──────────────────────
export function getStatusConfig(status: string): StatusConfig {
  const configs: Record<string, StatusConfig> = {
    UPCOMING: {
      label: "Upcoming",
      labelAr: "قادمة",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      dot: "bg-blue-400",
    },
    REGISTRATION_OPEN: {
      label: "Open",
      labelAr: "مفتوح",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      dot: "bg-green-400",
    },
    FULL: {
      label: "Full",
      labelAr: "مكتمل",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      dot: "bg-yellow-400",
    },
    IN_PROGRESS: {
      label: "Live",
      labelAr: "جارية",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      dot: "bg-orange-400",
    },
    COMPLETED: {
      label: "Completed",
      labelAr: "منتهية",
      color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      dot: "bg-slate-400",
    },
    CANCELLED: {
      label: "Cancelled",
      labelAr: "ملغاة",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      dot: "bg-red-400",
    },
  };

  return configs[status] ?? configs["UPCOMING"];
}