import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

// ── GET /api/notifications?cursor=<id> ──────────────────────────
// Returns the page after the given cursor, ordered newest first.
// Without a cursor, returns the first (most recent) page.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // skip the cursor item itself
        }
      : {}),
  });

  const hasMore = notifications.length > PAGE_SIZE;
  const page = hasMore ? notifications.slice(0, PAGE_SIZE) : notifications;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  // Unread count should reflect ALL unread notifications, not just this page
  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return NextResponse.json({
    notifications: page,
    unreadCount,
    nextCursor,
    hasMore,
  });
}

// ── PATCH /api/notifications — mark all as read ────────────────
export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "All notifications marked as read" });
}