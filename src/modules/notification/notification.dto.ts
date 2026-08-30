import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const NotificationResponseSchema = registry.register(
  "Notification",
  z.object({
    id: z.string().uuid(),
    title: z.string().nullable(),
    message: z.string(),
    userId: z.string().uuid(),
    read: z.boolean(),
    createdAt: z.string(),
  }),
);

export const getNotificationsSchema = z.object({
  query: paginationQuerySchema.extend({
    unread: z.enum(["true", "false"]).optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid notification ID format (must be UUID)"),
  }),
});
