import { registry } from "../../core/docs/registry";
import { UserSchema } from "./user.dto";
import { z } from "zod";

registry.registerPath({
  method: "get",
  path: "/users",
  summary: "List all users",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().openapi({ description: "Page number (default: 1)" }),
      limit: z.string().optional().openapi({ description: "Number of users per page (default: 10)" }),
    }),
  },
  responses: {
    200: {
      description: "Users retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              users: z.array(UserSchema),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  summary: "Get a user by ID",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "User UUID ID" }),
    }),
  },
  responses: {
    200: {
      description: "User retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: UserSchema,
          }),
        },
      },
    },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  summary: "Delete a user by ID",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "User UUID ID" }),
    }),
  },
  responses: {
    200: {
      description: "User deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    404: { description: "User not found" },
  },
});
