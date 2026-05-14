import { prisma } from '@/lib/prisma';
import { getGameWindows } from '@/lib/game';

const DEFAULT_GROUP_SLUG = 'd3-main-group';

export async function getDefaultGroup() {
  return prisma.group.upsert({
    where: { slug: DEFAULT_GROUP_SLUG },
    create: {
      name: 'D3 Volleyball Group',
      slug: DEFAULT_GROUP_SLUG,
      description: 'Default group for the D3 volleyball community.'
    },
    update: {}
  });
}

export async function createGame(date: Date) {
  const group = await getDefaultGroup();
  const { openAt, closeAt } = getGameWindows(date);

  return prisma.game.create({
    data: {
      groupId: group.id,
      date,
      openAt,
      closeAt,
      capacity: 36
    }
  });
}

export async function getUpcomingGames(limit = 6) {
  return prisma.game.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    take: limit,
    include: {
      _count: {
        select: { registrations: true }
      }
    }
  });
}
