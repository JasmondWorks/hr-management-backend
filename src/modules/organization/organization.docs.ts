import { registry } from "../../core/docs/registry";
import {
  CreateOrganizationBodySchema,
  AddUserToOrgBodySchema,
  OrganizationResponseSchema,
  UpdateOrganizationBodySchema,
} from "./organization.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

registry.registerPath({
  method: "patch",
  path: "/organizations/mine",
  summary: "Update the logged-in user's organization (org admin)",
  description:
    "Update org-level settings such as the daily attendance auto check-out time (24h HH:MM).",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: UpdateOrganizationBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Organization updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrganizationResponseSchema,
          }),
        },
      },
    },
    400: { description: "Validation error / no organization" },
  },
});

registry.registerPath({
  method: "get",
  path: "/organizations/mine",
  summary: "Get the logged-in user's organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Organization retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrganizationResponseSchema,
          }),
        },
      },
    },
    404: { description: "User is not part of any organization" },
  },
});

registry.registerPath({
  method: "get",
  path: "/organizations/users",
  summary: "List all users in the logged-in user's organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: {
      description: "Organization users retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(z.object({})),
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    404: { description: "User is not part of any organization" },
  },
});

registry.registerPath({
  method: "post",
  path: "/organizations/users",
  summary: "Add a user to the admin's organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: AddUserToOrgBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User added to organization",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({}),
          }),
        },
      },
    },
    400: { description: "User already in an organization" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/organizations/users/{userId}",
  summary: "Remove a user from the admin's organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({ description: "User UUID to remove" }),
    }),
  },
  responses: {
    200: {
      description: "User removed from organization",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({}),
          }),
        },
      },
    },
    400: { description: "User not in your organization or cannot remove yourself" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/organizations",
  summary: "Create a new organization",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: CreateOrganizationBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Organization created successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrganizationResponseSchema,
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/organizations",
  summary: "List all organizations",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: {
      description: "Organizations retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(OrganizationResponseSchema),
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/organizations/{id}",
  summary: "Get an organization by ID",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Organization UUID" }),
    }),
  },
  responses: {
    200: {
      description: "Organization retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrganizationResponseSchema,
          }),
        },
      },
    },
    404: { description: "Organization not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/organizations/{id}",
  summary: "Delete an organization by ID",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Organization UUID" }),
    }),
  },
  responses: {
    200: {
      description: "Organization deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    404: { description: "Organization not found" },
  },
});
