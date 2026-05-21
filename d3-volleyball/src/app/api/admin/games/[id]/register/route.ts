import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  canCancelRegistration,
  isRegistrationOpen,
} from "@/lib/game-utils";

// ── POST — Register for a game ─────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;
  const userId = session.user.id;

  // ── Fetch player and game in parallel ──────────────────
  const [player, game] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, isApproved: true, warningCount: true },
    }),
    db.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        date: true,
        maxPlayers: true,
        status: true,
        registrationOpensAt: true,
      },
    }),
  ]);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // ── Pre-checks ─────────────────────────────────────────
  if (!player?.isApproved) {
    return NextResponse.json(
      { error: "Your account is pending admin approval" },
      { status: 403 }
    );
  }

  if (player.isBanned) {
    return NextResponse.json(
      { error: "Your account is banned. Contact the admin." },
      { status: 403 }
    );
  }

  // Check for existing registration or waitlist entry
  const [existingReg, existingWait] = await Promise.all([
    db.registration.findUnique({ where: { userId_gameId: { userId, gameId } } }),
    db.waitingList.findUnique({ where: { userId_gameId: { userId, gameId } } }),
  ]);

  if (existingReg) {
    return NextResponse.json(
      { error: "You are already registered for this game" },
      { status: 409 }
    );
  }

  if (existingWait) {
    return NextResponse.json(
      { error: "You are already on the waiting list" },
      { status: 409 }
    );
  }

  // ── Use transaction to prevent race conditions ──────────
  // This ensures no two players can grab the last spot simultaneously
  const result = await db.$transaction(async (tx) => {
    // Re-count inside transaction for accuracy
    const confirmedCount = await tx.registration.count({
      where: { gameId, status: "CONFIRMED" },
    });

    // Check registration window inside transaction
    if (
      !isRegistrationOpen(
        game.date,
        game.registrationOpensAt,
        confirmedCount,
        game.maxPlayers
      )
    ) {
      // Still allow joining waitlist if game is FULL
      const computedFull = confirmedCount >= game.maxPlayers;
      if (!computedFull) {
        throw new Error("REGISTRATION_CLOSED");
      }
    }

    // Spot available → register
    if (confirmedCount < game.maxPlayers) {
      const registration = await tx.registration.create({
        data: { userId, gameId, status: "CONFIRMED" },
      });
      return { type: "REGISTERED", registration };
    }

    // Full → add to waiting list
    const waitingCount = await tx.waitingList.count({
      where: { gameId, isPromoted: false },
    });

    const waitEntry = await tx.waitingList.create({
      data: {
        userId,
        gameId,
        position: waitingCount + 1,
      },
    });

    return { type: "WAITLISTED", waitEntry, position: waitingCount + 1 };
  });

  if (result.type === "REGISTERED") {
    return NextResponse.json({
      message: "Successfully registered! See you on the court 🏐",
      status: "REGISTERED",
    });
  }

  return NextResponse.json({
    message: `Added to waiting list at position #${result.position}`,
    status: "WAITLISTED",
    position: result.position,
  });
}

// ── DELETE — Cancel registration ───────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;
  const userId = session.user.id;

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { date: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // ── Check if within 4-hour deadline ───────────────────
  const isLate = !canCancelRegistration(game.date);

  if (isLate) {
    return NextResponse.json(
      {
        error:
          "Cannot cancel within 4 hours of the game. Contact the admin.",
        code: "LATE_CANCELLATION",
      },
      { status: 400 }
    );
  }

  // Check what to cancel (registration or waiting list)
  const [registration, waitEntry] = await Promise.all([
    db.registration.findUnique({
      where: { userId_gameId: { userId, gameId } },
    }),
    db.waitingList.findUnique({
      where: { userId_gameId: { userId, gameId } },
    }),
  ]);

  if (!registration && !waitEntry) {
    return NextResponse.json(
      { error: "You are not registered for this game" },
      { status: 404 }
    );
  }

  if (waitEntry) {
    // Cancel waiting list entry — simple removal
    await db.waitingList.delete({
      where: { userId_gameId: { userId, gameId } },
    });
    return NextResponse.json({ message: "Removed from waiting list." });
  }

// Cancel confirmed registration + auto-promote first person on waitlist
await db.$transaction(async (tx) => {
  await tx.registration.update({
    where: { userId_gameId: { userId, gameId } },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      isLateCancellation: false,
    },
  });

  // Find the first person waiting
  const firstWaiting = await tx.waitingList.findFirst({
    where: { gameId, isPromoted: false },
    orderBy: { position: "asc" },
  });

  if (firstWaiting) {
    // Give them the now-open spot
    await tx.registration.create({
      data: {
        userId: firstWaiting.userId,
        gameId,
        status: "CONFIRMED",
      },
    });

    // Mark them as promoted in the waitlist
    await tx.waitingList.update({
      where: { id: firstWaiting.id },
      data: { isPromoted: true, promotedAt: new Date() },
    });

    // Shift everyone else up by 1 position
    await tx.waitingList.updateMany({
      where: {
        gameId,
        isPromoted: false,
        position: { gt: firstWaiting.position },
      },
      data: { position: { decrement: 1 } },
    });

    // Notify the promoted player
    await tx.notification.create({
      data: {
        userId: firstWaiting.userId,
        type: "MOVED_FROM_WAITLIST",
        title: "You got a spot! 🏐",
        message:
          "A spot opened up and you have been automatically registered for the game!",
        data: { gameId },
      },
    });
  }
});

return NextResponse.json({
  message: "Registration cancelled successfully.",
});}