import prisma from "../../core/config/prisma";
import {
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";

export interface CreateNotificationInput {
  userId: string;
  message: string;
  title?: string;
}

// Reusable across features: call NotificationService.create(...) from any
// service (attendance, leave, payroll, ...) to record an in-app notification.
export class NotificationService {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        message: input.message,
        title: input.title ?? null,
      },
    });
  }

  // Fan-out the same notification to many users (e.g. org-wide announcements).
  async createMany(userIds: string[], message: string, title?: string) {
    if (userIds.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, message, title: title ?? null })),
    });
  }

  async listForUser(
    userId: string,
    query: PaginationQuery & { unread?: string },
  ) {
    const parsed = parseQuery(query);
    const where: any = { userId };
    if (query.unread === "true") where.read = false;
    if (query.unread === "false") where.read = true;

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { createdAt: parsed.order },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { data, total, unreadCount, page: parsed.page, limit: parsed.limit };
  }

  async markRead(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException("This notification is not yours");
    }
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
