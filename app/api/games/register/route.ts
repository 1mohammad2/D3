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

  const [existingRegistration, confirmedCount] = await prisma.$transaction([
    prisma.registration.findUnique({ where: { userId_gameId: { userId: user.id, gameId: game.id } } }),
    prisma.registration.count({ where: { gameId: game.id, status: 'CONFIRMED' } })
  ]);

  if (existingRegistration && existingRegistration.status === 'CONFIRMED') {
    return NextResponse.json({ error: 'You are already registered for this game.' }, { status: 409 });
  }

  if (confirmedCount >= game.capacity) {
    return NextResponse.json({ error: 'This game is full. Please wait for the next available slot.' }, { status: 409 });
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
      type: 'CONFIRMED',
      title: 'Registration confirmed',
      message: `You have secured a spot for the game on ${game.date.toISOString()}.`,
      read: false,
      payload: { gameId: game.id }
    }
  });

  return NextResponse.json({ registration });
}
