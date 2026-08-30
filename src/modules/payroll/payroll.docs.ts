import { registry } from "../../core/docs/registry";
import {
  GeneratePayrollBodySchema,
  PayrollResponseSchema,
} from "./payroll.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

const listResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(PayrollResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

registry.registerPath({
  method: "post",
  path: "/payroll/generate",
  summary: "Generate monthly payroll for the organization (HR/admin)",
  description:
    "Creates PENDING payroll rows for every employee with a salary set. Idempotent — existing rows for the same employee/month/year are skipped.",
  tags: ["Payroll"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: GeneratePayrollBodySchema } },
    },
  },
  responses: {
    201: { description: "Payroll generated" },
    400: { description: "No employees with a salary set" },
  },
});

registry.registerPath({
  method: "get",
  path: "/payroll",
  summary: "List organization payroll (HR/admin)",
  tags: ["Payroll"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      month: z.string().optional(),
      year: z.string().optional(),
      status: z.enum(["PENDING", "PAID", "UNPAID"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Payroll retrieved",
      content: { "application/json": { schema: listResponse } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/payroll/mine",
  summary: "List my payslips (employee)",
  tags: ["Payroll"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Payroll retrieved",
      content: { "application/json": { schema: listResponse } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/payroll/{id}/pay",
  summary: "Mark a payroll as paid (HR/admin)",
  description: "Sets status to PAID and notifies the employee.",
  tags: ["Payroll"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Payroll UUID" }),
    }),
  },
  responses: {
    200: { description: "Payroll marked as paid" },
    400: { description: "Already paid" },
    403: { description: "Not your organization's payroll" },
    404: { description: "Payroll not found" },
  },
});
