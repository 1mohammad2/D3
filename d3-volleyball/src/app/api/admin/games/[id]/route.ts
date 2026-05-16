import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

// ── DELETE /api/admin/games/[id] — delete a game ──────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  // Cannot delete games with registrations
  const registrationCount = await db.registration.count({
    where: { gameId: id },
  });

  if (registrationCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a game that has registrations. Cancel it instead." },
      { status: 400 }
    );
  }

  await db.game.delete({ where: { id } });
  return NextResponse.json({ message: "Game deleted successfully" });
}