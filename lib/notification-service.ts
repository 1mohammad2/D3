import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function createNotification(params: {
  userId: string;
  gameId?: string;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      gameId: params.gameId,
      type: params.type,
      title: params.title,
      message: params.message,
      payload: params.payload,
      read: false
    }
  });
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
}
