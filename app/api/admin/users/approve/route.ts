import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const userId = body?.userId;
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { approved: true }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'CONFIRMED',
      title: 'Registration approved',
      message: 'Your D3 account has been approved. Sign in to manage your game profile.',
      read: false
    }
  });

  return NextResponse.json({ message: 'User approved successfully.' });
}
