import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const LeaveResponseSchema = registry.register(
  "Leave",
  z.object({
    id: z.string().uuid(),
    employeeId: z.string().uuid(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    leaveType: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]),
    leaveReason: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const CreateLeaveBodySchema = registry.register(
  "CreateLeaveInput",
  z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    leaveType: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]).default("ANNUAL"),
    leaveReason: z
      .string({ message: "Leave reason is required" })
      .min(3, "Leave reason must be at least 3 characters long"),
  }),
);

export const createLeaveSchema = z.object({
  body: CreateLeaveBodySchema,
});

export const leaveIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid leave ID format (must be UUID)"),
  }),
});

export const getLeavesSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    employeeId: z.string().uuid().optional(),
  }),
});

export type CreateLeaveDto = z.infer<typeof CreateLeaveBodySchema>;
