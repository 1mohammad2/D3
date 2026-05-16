import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// ── PATCH /api/notifications/[id] — mark single as read ────────
export async function PATCH(
  _req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.notification.updateMany({
    where: {
      id,
      userId: session.user.id, // Security: only own notifications
    },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "Marked as read" });
}