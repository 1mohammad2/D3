import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { WARNING_CONFIG } from "@/lib/constants";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET — list all registrations with attendance status ────────
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { id: true, date: true, status: true, venue: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const registrations = await db.registration.findMany({
    where: { gameId, status: "CONFIRMED" },
    orderBy: { registeredAt: "asc" },
    select: {
      id: true,
      attended: true,
      registeredAt: true,
      isLateCancellation: true,
      user: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          skillLevel: true,
          gender: true,
          warningCount: true,
          isBanned: true,
          profilePhoto: true,
        },
      },
    },
  });

  // Summary counts
  const attended = registrations.filter((r) => r.attended === true).length;
  const absent = registrations.filter((r) => r.attended === false).length;
  const unmarked = registrations.filter((r) => r.attended === null).length;

  return NextResponse.json({
    game,
    registrations,
    summary: { total: registrations.length, attended, absent, unmarked },
  });
}

// ── PATCH — mark attendance or apply warnings ──────────────────
const markSchema = z.object({
  action: z.literal("mark"),
  registrationId: z.string(),
  attended: z.boolean(),
});

const bulkSchema = z.object({
  action: z.literal("bulk_mark"),
  attendedIds: z.array(z.string()),   // registration IDs that attended
  absentIds: z.array(z.string()),     // registration IDs that were absent
});

const warnSchema = z.object({
  action: z.literal("apply_warnings"),
});

const patchSchema = z.discriminatedUnion("action", [
  markSchema,
  bulkSchema,
  warnSchema,
]);

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: gameId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ── MARK single attendance ─────────────────────────────────
  if (parsed.data.action === "mark") {
    const { registrationId, attended } = parsed.data;

    await db.registration.update({
      where: { id: registrationId, gameId },
      data: { attended },
    });

    return NextResponse.json({
      message: `Marked as ${attended ? "attended ✅" : "absent ❌"}`,
    });
  }

  // ── BULK MARK attendance ───────────────────────────────────
  if (parsed.data.action === "bulk_mark") {
    const { attendedIds, absentIds } = parsed.data;

    await db.$transaction([
      db.registration.updateMany({
        where: { id: { in: attendedIds }, gameId },
        data: { attended: true },
      }),
      db.registration.updateMany({
        where: { id: { in: absentIds }, gameId },
        data: { attended: false },
      }),
    ]);

    return NextResponse.json({
      message: `Updated: ${attendedIds.length} attended, ${absentIds.length} absent`,
    });
  }

  // ── APPLY WARNINGS to absent players ──────────────────────
  if (parsed.data.action === "apply_warnings") {
    // Find all absent registrations for this game
    const absentRegs = await db.registration.findMany({
      where: { gameId, status: "CONFIRMED", attended: false },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            fullName: true,
            warningCount: true,
            isBanned: true,
          },
        },
      },
    });

    if (absentRegs.length === 0) {
      return NextResponse.json({
        message: "No absent players to warn",
        warned: 0,
        autoBanned: 0,
      });
    }

    let warned = 0;
    let autoBanned = 0;

    // Process each absent player
    await db.$transaction(async (tx) => {
      for (const reg of absentRegs) {
        const player = reg.user;

        // Skip already banned players
        if (player.isBanned) continue;

        // Check if warning already exists for this game + player
        const existingWarning = await tx.warning.findFirst({
          where: {
            userId: player.id,
            gameId,
            isRemoved: false,
          },
        });

        if (existingWarning) continue; // Already warned

        const newWarningCount = player.warningCount + 1;

        // Create warning record
        await tx.warning.create({
          data: {
            userId: player.id,
            gameId,
            reason: "Registered for game but did not attend",
          },
        });

        // Update warning count
        await tx.user.update({
          where: { id: player.id },
          data: { warningCount: newWarningCount },
        });

        warned++;

        // Auto-ban after threshold
        if (newWarningCount >= WARNING_CONFIG.WARNINGS_BEFORE_BAN) {
          const banEndsAt = new Date();
          banEndsAt.setDate(
            banEndsAt.getDate() + WARNING_CONFIG.BAN_DURATION_DAYS
          );

          await tx.ban.create({
            data: {
              userId: player.id,
              reason: `Auto-ban: ${WARNING_CONFIG.WARNINGS_BEFORE_BAN} warnings for not attending`,
              endsAt: banEndsAt,
              isManual: false,
            },
          });

          await tx.user.update({
            where: { id: player.id },
            data: { isBanned: true, warningCount: 0 },
          });

          // Notify player of ban
          await tx.notification.create({
            data: {
              userId: player.id,
              type: "BAN_ISSUED",
              title: "Account Banned 🚫",
              message: `You have been banned for ${WARNING_CONFIG.BAN_DURATION_DAYS} days due to repeated no-shows.`,
              data: { gameId },
            },
          });

          autoBanned++;
        } else {
          // Notify of warning
          await tx.notification.create({
            data: {
              userId: player.id,
              type: "WARNING_ISSUED",
              title: "Warning Issued ⚠️",
              message: `You received a warning for not attending a game. ${WARNING_CONFIG.WARNINGS_BEFORE_BAN - newWarningCount} more warning(s) will result in a ban.`,
              data: { gameId },
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: `Warnings applied: ${warned} warned, ${autoBanned} auto-banned`,
      warned,
      autoBanned,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}