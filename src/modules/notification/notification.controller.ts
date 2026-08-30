import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { sendSuccess } from "../../core/utils/response.util";

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  getMine = async (req: Request, res: Response): Promise<void> => {
    const { data, total, unreadCount, page, limit } =
      await this.notificationService.listForUser(
        req.user!.userId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Notifications retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    });
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const notification = await this.notificationService.markRead(
      req.user!.userId,
      req.params.id as string,
    );
    sendSuccess(res, 200, "Notification marked as read", notification);
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    const result = await this.notificationService.markAllRead(req.user!.userId);
    sendSuccess(res, 200, "All notifications marked as read", result);
  };
}
