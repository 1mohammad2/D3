import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createGame, getUpcomingGames } from '@/lib/game-service';
import { isValidGameDate } from '@/lib/game';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const games = await getUpcomingGames();
  return NextResponse.json({ games });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const dateString = body?.date;
  if (!dateString || typeof dateString !== 'string') {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime()) || !isValidGameDate(date) || date <= new Date()) {
    return NextResponse.json({ error: 'Game date must be a future Wednesday, Friday, or Sunday at 20:30.' }, { status: 422 });
  }

  try {
    const game = await createGame(date);
    return NextResponse.json({ game });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A game already exists for that date and time.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to create game.' }, { status: 500 });
  }
}
