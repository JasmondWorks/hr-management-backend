import { registry } from "../../core/docs/registry";
import { NotificationResponseSchema } from "./notification.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

registry.registerPath({
  method: "get",
  path: "/notifications",
  summary: "List the logged-in user's notifications",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      unread: z.enum(["true", "false"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Notifications retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(NotificationResponseSchema),
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
              unreadCount: z.number(),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/read-all",
  summary: "Mark all the user's notifications as read",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "All notifications marked as read" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/{id}/read",
  summary: "Mark a notification as read",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Notification UUID" }),
    }),
  },
  responses: {
    200: { description: "Notification marked as read" },
    403: { description: "Not your notification" },
    404: { description: "Notification not found" },
  },
});
