import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canCancelRegistration, isRegistrationOpen } from "@/lib/game-utils";

type RouteParams = { params: Promise<{ id: string }> };

// ── POST — Register for a game ─────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Next.js 15: always await params
  const { id: gameId } = await params;
  const userId = session.user.id;

  // Fetch player and game in parallel
  const [player, game] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, isApproved: true },
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

  // Check existing registration or waitlist
  const [existingReg, existingWait] = await Promise.all([
    db.registration.findUnique({
      where: { userId_gameId: { userId, gameId } },
    }),
    db.waitingList.findUnique({
      where: { userId_gameId: { userId, gameId } },
    }),
  ]);

  // Only a CONFIRMED registration blocks re-registering.
  // A CANCELLED one is allowed to be reactivated below.
  if (existingReg && existingReg.status === "CONFIRMED") {
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

  // ── Transaction prevents race conditions ──────────────────────
  type RegisterResult =
    | { type: "REGISTERED" }
    | { type: "WAITLISTED"; position: number };

  const result: RegisterResult = await db.$transaction(async (tx) => {
    const confirmedCount = await tx.registration.count({
      where: { gameId, status: "CONFIRMED" },
    });

    // Check if registration is open
    const open = isRegistrationOpen(
      game.date,
      game.registrationOpensAt,
      confirmedCount,
      game.maxPlayers
    );

    const isFull = confirmedCount >= game.maxPlayers;

    if (!open && !isFull) {
      throw new Error("REGISTRATION_CLOSED");
    }

    // Spot available → register directly
    if (confirmedCount < game.maxPlayers) {
      // upsert: if a CANCELLED record already exists for this user+game,
      // reactivate it instead of creating a new row (unique constraint
      // on userId+gameId would otherwise reject a second create()).
      await tx.registration.upsert({
        where: { userId_gameId: { userId, gameId } },
        create: { userId, gameId, status: "CONFIRMED" },
        update: {
          status: "CONFIRMED",
          registeredAt: new Date(),
          cancelledAt: null,
          isLateCancellation: false,
          attended: null,
        },
      });
      return { type: "REGISTERED" };
    }

    // Full → add to waiting list
    const waitingCount = await tx.waitingList.count({
      where: { gameId, isPromoted: false },
    });

    await tx.waitingList.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: { userId, gameId, position: waitingCount + 1 },
      update: {
        position: waitingCount + 1,
        isPromoted: false,
        promotedAt: null,
      },
    });

    return { type: "WAITLISTED", position: waitingCount + 1 };
  });

  if (result.type === "REGISTERED") {
    return NextResponse.json({
      message: "Registered successfully! See you on the court 🏐",
      status: "REGISTERED",
    });
  }

  return NextResponse.json({
    message: `Added to waiting list at position #${result.position}`,
    status: "WAITLISTED",
    position: result.position,
  });
}

// ── DELETE — Cancel registration ───────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Next.js 15: always await params
  const { id: gameId } = await params;
  const userId = session.user.id;

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { date: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (!canCancelRegistration(game.date)) {
    return NextResponse.json(
      { error: "Cannot cancel within 4 hours of the game. Contact admin.", code: "LATE_CANCELLATION" },
      { status: 400 }
    );
  }

  // Check what to cancel
  const [registration, waitEntry] = await Promise.all([
    db.registration.findUnique({ where: { userId_gameId: { userId, gameId } } }),
    db.waitingList.findUnique({ where: { userId_gameId: { userId, gameId } } }),
  ]);

  if (!registration && !waitEntry) {
    return NextResponse.json(
      { error: "You are not registered for this game" },
      { status: 404 }
    );
  }

  // Cancel waiting list entry
  if (waitEntry && !registration) {
    await db.waitingList.delete({ where: { userId_gameId: { userId, gameId } } });
    return NextResponse.json({ message: "Removed from waiting list." });
  }

  // Cancel confirmed registration + auto-promote first on waiting list
  await db.$transaction(async (tx) => {
    // Cancel the registration
    await tx.registration.update({
      where: { userId_gameId: { userId, gameId } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Find first player on waiting list
    const firstWaiting = await tx.waitingList.findFirst({
      where: { gameId, isPromoted: false },
      orderBy: { position: "asc" },
    });

    if (firstWaiting) {
      // Auto-promote: give them the spot
      await tx.registration.upsert({
        where: { userId_gameId: { userId: firstWaiting.userId, gameId } },
        create: {
          userId: firstWaiting.userId,
          gameId,
          status: "CONFIRMED",
        },
        update: {
          status: "CONFIRMED",
          registeredAt: new Date(),
          cancelledAt: null,
          isLateCancellation: false,
          attended: null,
        },
      });

      // Mark as promoted
      await tx.waitingList.update({
        where: { id: firstWaiting.id },
        data: { isPromoted: true, promotedAt: new Date() },
      });

      // Shift remaining waiting list positions
      await tx.waitingList.updateMany({
        where: { gameId, isPromoted: false, position: { gt: firstWaiting.position } },
        data: { position: { decrement: 1 } },
      });

      // Create notification for promoted player
      await tx.notification.create({
        data: {
          userId: firstWaiting.userId,
          type: "MOVED_FROM_WAITLIST",
          title: "You got a spot! 🏐",
          message: "A spot opened up and you've been automatically registered for the game!",
          data: { gameId },
        },
      });
    }
  });

  return NextResponse.json({ message: "Registration cancelled successfully." });
}