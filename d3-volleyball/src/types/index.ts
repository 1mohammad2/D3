/**
 * Global TypeScript Types for D3 Platform
 * Shared types used across the entire application.
 */

export type Role = "ADMIN" | "PLAYER";

export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "SETTER";

export type Gender = "MALE" | "FEMALE";

export type GameStatus = "UPCOMING" | "REGISTRATION_OPEN" | "FULL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type RegistrationStatus = "CONFIRMED" | "WAITLISTED" | "CANCELLED";

export type NotificationType =
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CONFIRMED"
  | "MOVED_FROM_WAITLIST"
  | "TEAMS_PUBLISHED"
  | "SCHEDULE_PUBLISHED"
  | "GAME_REMINDER"
  | "CANCELLATION_ALERT"
  | "WARNING_ISSUED"
  | "BAN_ISSUED";

// Base user type used throughout the frontend
export interface UserBase {
  id: string;
  fullName: string;
  nickname?: string | null;
  email: string;
  role: Role;
  skillLevel: SkillLevel;
  gender: Gender;
  profilePhoto?: string | null;
  rankingScore: number;
  isApproved: boolean;
  isBanned: boolean;
}