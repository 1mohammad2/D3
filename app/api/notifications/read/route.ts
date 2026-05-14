import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { markNotificationRead } from '@/lib/notification-service';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const notificationId = body?.notificationId;
  if (!notificationId || typeof notificationId !== 'string') {
    return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
  }

  const updated = await markNotificationRead(notificationId);
  return NextResponse.json({ notification: updated });
}
