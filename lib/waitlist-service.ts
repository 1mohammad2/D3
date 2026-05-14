import { prisma } from '@/lib/prisma';

export async function addToWaitingList(userId: string, gameId: string) {
  const position = await prisma.waitingListItem.count({ where: { gameId } });

  return prisma.waitingListItem.create({
    data: {
      userId,
      gameId,
      position: position + 1
    }
  });
}

export async function getWaitingPosition(userId: string, gameId: string) {
  const item = await prisma.waitingListItem.findUnique({
    where: { userId_gameId: { userId, gameId } }
  });
  return item?.position ?? null;
}

export async function promoteNextWaitingUser(gameId: string) {
  const nextItem = await prisma.waitingListItem.findFirst({
    where: { gameId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
  });

  if (!nextItem) {
    return null;
  }

  const promotedRegistration = await prisma.$transaction(async (tx) => {
    await tx.waitingListItem.delete({ where: { id: nextItem.id } });
    await tx.waitingListItem.updateMany({
      where: { gameId, position: { gt: nextItem.position } },
      data: { position: { decrement: 1 } }
    });
    return tx.registration.create({
      data: {
        userId: nextItem.userId,
        gameId,
        status: 'CONFIRMED',
        confirmedAt: new Date()
      }
    });
  });

  return { registration: promotedRegistration, userId: nextItem.userId };
}

export async function removeWaitingListItem(userId: string, gameId: string) {
  const item = await prisma.waitingListItem.findUnique({ where: { userId_gameId: { userId, gameId } } });
  if (!item) {
    return null;
  }

  const removed = await prisma.$transaction(async (tx) => {
    await tx.waitingListItem.delete({ where: { id: item.id } });
    await tx.waitingListItem.updateMany({
      where: { gameId, position: { gt: item.position } },
      data: { position: { decrement: 1 } }
    });
    return item;
  });

  return removed;
}

export async function getWaitingListForGame(gameId: string) {
  return prisma.waitingListItem.findMany({
    where: { gameId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
  });
}
