import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { z } from "zod";
import { WARNING_CONFIG } from "@/lib/constants";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "warn", "ban", "unban", "remove_warning"]),
  reason: z.string().optional(),
  warningId: z.string().optional(),
});

/**
 * PATCH /api/admin/players/[id]
 * Next.js 15 FIX: params is now a Promise — must be awaited.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Next.js 15: Promise type
) {
  const { error } = await requireAdmin();
  if (error) return error;

  // ✅ THE FIX: await params before accessing .id
  const { id: playerId } = await params;

  // Safety check — id must exist
  if (!playerId) {
    return NextResponse.json({ error: "Player ID is missing" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, reason, warningId } = parsed.data;

  // Verify player exists
  const player = await db.user.findUnique({
    where: { id: playerId, role: "PLAYER" },
    select: { id: true, fullName: true, warningCount: true, isBanned: true },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  switch (action) {
    // ─── APPROVE ───────────────────────────────────────────
    case "approve": {
      await db.user.update({
        where: { id: playerId },
        data: { isApproved: true },
      });
      return NextResponse.json({ message: `${player.fullName} has been approved.` });
    }

    // ─── REJECT ────────────────────────────────────────────
    case "reject": {
      await db.user.delete({ where: { id: playerId } });
      return NextResponse.json({ message: "Registration rejected and removed." });
    }

    // ─── WARN ──────────────────────────────────────────────
    case "warn": {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Warning reason is required" }, { status: 400 });
      }

      const newWarningCount = player.warningCount + 1;

      await db.warning.create({
        data: { userId: playerId, reason },
      });

      await db.user.update({
        where: { id: playerId },
        data: { warningCount: newWarningCount },
      });

      // Auto-ban after 2 warnings
      if (newWarningCount >= WARNING_CONFIG.WARNINGS_BEFORE_BAN) {
        const banEndsAt = new Date();
        banEndsAt.setDate(banEndsAt.getDate() + WARNING_CONFIG.BAN_DURATION_DAYS);

        await db.ban.create({
          data: {
            userId: playerId,
            reason: `Automatic ban after ${WARNING_CONFIG.WARNINGS_BEFORE_BAN} warnings`,
            endsAt: banEndsAt,
            isManual: false,
          },
        });

        await db.user.update({
          where: { id: playerId },
          data: { isBanned: true, warningCount: 0 },
        });

        return NextResponse.json({
          message: `Warning issued. ${player.fullName} automatically banned for ${WARNING_CONFIG.BAN_DURATION_DAYS} days.`,
          autoBanned: true,
        });
      }

      return NextResponse.json({
        message: `Warning issued. ${player.fullName} now has ${newWarningCount} warning(s).`,
        autoBanned: false,
      });
    }

    // ─── BAN (manual) ──────────────────────────────────────
    case "ban": {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Ban reason is required" }, { status: 400 });
      }

      const banEndsAt = new Date();
      banEndsAt.setDate(banEndsAt.getDate() + WARNING_CONFIG.BAN_DURATION_DAYS);

      await db.ban.create({
        data: { userId: playerId, reason, endsAt: banEndsAt, isManual: true },
      });

      await db.user.update({
        where: { id: playerId },
        data: { isBanned: true },
      });

      return NextResponse.json({ message: `${player.fullName} has been banned.` });
    }

    // ─── UNBAN ─────────────────────────────────────────────
    case "unban": {
      await db.ban.updateMany({
        where: { userId: playerId, isLifted: false },
        data: { isLifted: true },
      });

      await db.user.update({
        where: { id: playerId },
        data: { isBanned: false },
      });

      return NextResponse.json({ message: `${player.fullName} has been unbanned.` });
    }

    // ─── REMOVE WARNING ────────────────────────────────────
    case "remove_warning": {
      if (!warningId) {
        return NextResponse.json({ error: "Warning ID is required" }, { status: 400 });
      }

      await db.warning.update({
        where: { id: warningId },
        data: { isRemoved: true, removedAt: new Date() },
      });

      const newCount = Math.max(0, player.warningCount - 1);
      await db.user.update({
        where: { id: playerId },
        data: { warningCount: newCount },
      });

      return NextResponse.json({ message: "Warning removed successfully." });
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}