import { NotificationType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { removeWaitingListItem } from '@/lib/waitlist-service';

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

  const waitingItem = await removeWaitingListItem(session.user.id, gameId);
  if (!waitingItem) {
    return NextResponse.json({ error: 'Not on the waiting list.' }, { status: 404 });
  }

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      gameId,
      type: NotificationType.WAITLIST_UPDATE,
      title: 'Waiting list removed',
      message: 'You have been removed from the waiting list for this game.',
      read: false,
      payload: { gameId }
    }
  });

  return NextResponse.json({ message: 'Removed from waiting list successfully.' });
}
