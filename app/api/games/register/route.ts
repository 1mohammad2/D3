import { NotificationType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addToWaitingList } from '@/lib/waitlist-service';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const gameId = body?.gameId;
  if (!gameId || typeof gameId !== 'string') {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.approved) {
    return NextResponse.json({ error: 'Player account is not approved.' }, { status: 403 });
  }

  if (user.bannedUntil && user.bannedUntil > new Date()) {
    return NextResponse.json({ error: 'You are currently banned from registering.' }, { status: 403 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
  }

  const now = new Date();
  if (now < game.openAt) {
    return NextResponse.json({ error: 'Registration has not opened yet.' }, { status: 409 });
  }

  if (now >= game.date) {
    return NextResponse.json({ error: 'Game has already started.' }, { status: 409 });
  }

  const [existingRegistration, confirmedCount, waitingItem] = await prisma.$transaction([
    prisma.registration.findUnique({ where: { userId_gameId: { userId: user.id, gameId: game.id } } }),
    prisma.registration.count({ where: { gameId: game.id, status: 'CONFIRMED' } }),
    prisma.waitingListItem.findUnique({ where: { userId_gameId: { userId: user.id, gameId: game.id } } })
  ]);

  if (existingRegistration && existingRegistration.status === 'CONFIRMED') {
    return NextResponse.json({ error: 'You are already registered for this game.' }, { status: 409 });
  }

  if (waitingItem) {
    return NextResponse.json({ error: 'You are already on the waiting list for this game.' }, { status: 409 });
  }

  if (confirmedCount >= game.capacity) {
    const waitingLine = await addToWaitingList(user.id, game.id);
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        gameId: game.id,
        type: NotificationType.WAITLIST_JOIN,
        title: 'Waiting list confirmed',
        message: `The game is full. You have been added to the waiting list in position ${waitingLine.position}.`,
        read: false,
        payload: { gameId: game.id, position: waitingLine.position }
      }
    });
    return NextResponse.json({ waitingList: waitingLine, notification }, { status: 201 });
  }

  const registration = await prisma.registration.create({
    data: {
      userId: user.id,
      gameId: game.id,
      status: 'CONFIRMED',
      confirmedAt: now
    }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      gameId: game.id,
      type: NotificationType.CONFIRMED,
      title: 'Registration confirmed',
      message: `You have secured a spot for the game on ${game.date.toISOString()}.`,
      read: false,
      payload: { gameId: game.id }
    }
  });

  return NextResponse.json({ registration });
}
