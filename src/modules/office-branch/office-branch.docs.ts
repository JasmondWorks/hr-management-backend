import { registry } from "../../core/docs/registry";
import {
  CreateOfficeBranchBodySchema,
  UpdateOfficeBranchBodySchema,
  OfficeBranchResponseSchema,
} from "./office-branch.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

const idParam = z.object({
  id: z.string().uuid().openapi({ description: "Office branch ID" }),
});

registry.registerPath({
  method: "post",
  path: "/office-branches",
  summary: "Create an office branch (organization admin)",
  description:
    "Creates an office branch in the logged-in admin's organization. Marking it as headquarters demotes any existing headquarters.",
  tags: ["Office Branches"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateOfficeBranchBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Office branch created",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OfficeBranchResponseSchema,
          }),
        },
      },
    },
    400: { description: "You are not part of any organization" },
    403: { description: "Insufficient role" },
    409: { description: "Branch name already exists in your organization" },
  },
});

registry.registerPath({
  method: "get",
  path: "/office-branches",
  summary: "List office branches in your organization",
  tags: ["Office Branches"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Office branches retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(OfficeBranchResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/office-branches/{id}",
  summary: "Get one office branch",
  tags: ["Office Branches"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: {
      description: "Office branch retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OfficeBranchResponseSchema,
          }),
        },
      },
    },
    404: { description: "Office branch not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/office-branches/{id}",
  summary: "Update an office branch (organization admin)",
  tags: ["Office Branches"],
  security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
    body: {
      required: true,
      content: {
        "application/json": { schema: UpdateOfficeBranchBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Office branch updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OfficeBranchResponseSchema,
          }),
        },
      },
    },
    403: { description: "Insufficient role" },
    404: { description: "Office branch not found" },
    409: { description: "Branch name already exists in your organization" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/office-branches/{id}",
  summary: "Delete an office branch (organization admin)",
  description:
    "Refused with 409 while any job or employee still references the branch.",
  tags: ["Office Branches"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Office branch deleted" },
    403: { description: "Insufficient role" },
    404: { description: "Office branch not found" },
    409: { description: "Branch is still referenced by jobs or employees" },
  },
});
