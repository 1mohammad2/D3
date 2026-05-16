import { db } from "@/lib/db";

// Notification type — matches Prisma enum
type NotifType =
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CONFIRMED"
  | "MOVED_FROM_WAITLIST"
  | "TEAMS_PUBLISHED"
  | "SCHEDULE_PUBLISHED"
  | "GAME_REMINDER"
  | "CANCELLATION_ALERT"
  | "WARNING_ISSUED"
  | "BAN_ISSUED";

type CreateNotifInput = {
  userId: string;
  type: NotifType;
  title: string;
  message: string;
  data?: Record<string, string>;
};

// ── Create single notification ─────────────────────────────────
export async function createNotification(input: CreateNotifInput) {
  try {
    return await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
      },
    });
  } catch (error) {
    // Never let notification failure break the main flow
    console.error("[NOTIFICATION_ERROR]", error);
    return null;
  }
}

// ── Notify all users in a list ─────────────────────────────────
export async function createBulkNotifications(
  userIds: string[],
  type: NotifType,
  title: string,
  message: string,
  data?: Record<string, string>
) {
  if (userIds.length === 0) return;

  try {
    await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        data: data ?? {},
      })),
    });
  } catch (error) {
    console.error("[BULK_NOTIFICATION_ERROR]", error);
  }
}

// ── Notify all registered players for a game ──────────────────
export async function notifyGamePlayers(
  gameId: string,
  type: NotifType,
  title: string,
  message: string
) {
  const registrations = await db.registration.findMany({
    where: { gameId, status: "CONFIRMED" },
    select: { userId: true },
  });

  const userIds = registrations.map((r) => r.userId);
  await createBulkNotifications(userIds, type, title, message, { gameId });
}