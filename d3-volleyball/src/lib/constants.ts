/**
 * D3 Platform Constants
 * All business logic numbers live here — easy to change in one place.
 */

export const GAME_CONFIG = {
  MAX_PLAYERS: 36,
  TEAMS_COUNT: 6,
  PLAYERS_PER_TEAM: 6,
  COURTS_COUNT: 2,
  GAME_START_HOUR: 20, // 8:30 PM in 24h
  GAME_START_MINUTE: 30,
  REGISTRATION_OPENS_HOURS_BEFORE: 30, // opens 30h before game
  CANCELLATION_DEADLINE_HOURS: 4, // can't cancel within 4h of game
  GAME_DAYS: [3, 5, 0] as const, // Wednesday=3, Friday=5, Sunday=0
} as const;

export const WARNING_CONFIG = {
  WARNINGS_BEFORE_BAN: 2,
  BAN_DURATION_DAYS: 7,
  BANNED_GAMES_COUNT: 3, // cannot register for 3 games when banned
} as const;

export const RANKING_CONFIG = {
  POINTS_PER_WIN: 1,
  RANKING_FORMULA: (points: number, gamesPlayed: number): number => {
    if (gamesPlayed === 0) return 0;
    return Math.round((points / gamesPlayed) * 100);
  },
} as const;

export const APP_CONFIG = {
  APP_NAME: "D3",
  APP_DESCRIPTION: "Volleyball Game Management Platform",
  DEFAULT_LOCALE: "en",
  SUPPORTED_LOCALES: ["en", "ar"] as const,
} as const;