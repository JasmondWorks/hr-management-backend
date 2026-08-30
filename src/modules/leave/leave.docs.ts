import { registry } from "../../core/docs/registry";
import { CreateLeaveBodySchema, LeaveResponseSchema } from "./leave.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

const listResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(LeaveResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const leaveIdParam = z.object({
  id: z.string().uuid().openapi({ description: "Leave UUID" }),
});

registry.registerPath({
  method: "post",
  path: "/leaves",
  summary: "Request leave (employee)",
  tags: ["Leave"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateLeaveBodySchema } },
    },
  },
  responses: {
    201: { description: "Leave requested" },
    400: { description: "Invalid dates" },
    404: { description: "No employee profile" },
  },
});

registry.registerPath({
  method: "get",
  path: "/leaves/mine",
  summary: "List my leave requests (employee)",
  tags: ["Leave"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Leave requests retrieved",
      content: { "application/json": { schema: listResponse } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/leaves",
  summary: "List organization leave requests (HR/admin)",
  tags: ["Leave"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Leave requests retrieved",
      content: { "application/json": { schema: listResponse } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/leaves/{id}/approve",
  summary: "Approve a leave request (HR/admin)",
  tags: ["Leave"],
  security: [{ bearerAuth: [] }],
  request: { params: leaveIdParam },
  responses: {
    200: { description: "Leave approved" },
    400: { description: "Already decided" },
    403: { description: "Not your organization" },
    404: { description: "Leave not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/leaves/{id}/reject",
  summary: "Reject a leave request (HR/admin)",
  tags: ["Leave"],
  security: [{ bearerAuth: [] }],
  request: { params: leaveIdParam },
  responses: {
    200: { description: "Leave rejected" },
    400: { description: "Already decided" },
    403: { description: "Not your organization" },
    404: { description: "Leave not found" },
  },
});
