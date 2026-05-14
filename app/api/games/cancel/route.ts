import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const registration = await prisma.registration.findUnique({
    where: { userId_gameId: { userId: session.user.id, gameId } }
  });

  if (!registration || registration.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'No active registration found.' }, { status: 404 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
  }

  const now = new Date();
  if (now >= game.closeAt) {
    return NextResponse.json({ error: 'Cancellation is not allowed less than 4 hours before the game.' }, { status: 403 });
  }

  await prisma.registration.update({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      isLateCancel: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      gameId: game.id,
      type: 'CANCELLATION',
      title: 'Registration cancelled',
      message: `Your spot for the game on ${game.date.toISOString()} has been cancelled.`,
      read: false,
      payload: { gameId: game.id }
    }
  });

  return NextResponse.json({ message: 'Registration cancelled successfully.' });
}
