import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const PayrollResponseSchema = registry.register(
  "Payroll",
  z.object({
    id: z.string().uuid(),
    employeeId: z.string().uuid(),
    month: z.number(),
    year: z.number(),
    amount: z.number(),
    status: z.enum(["PENDING", "PAID", "UNPAID"]),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const GeneratePayrollBodySchema = registry.register(
  "GeneratePayrollInput",
  z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
  }),
);

export const generatePayrollSchema = z.object({
  body: GeneratePayrollBodySchema,
});

export const payrollIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid payroll ID format (must be UUID)"),
  }),
});

export const getPayrollsSchema = z.object({
  query: paginationQuerySchema.extend({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().optional(),
    status: z.enum(["PENDING", "PAID", "UNPAID"]).optional(),
  }),
});

export type GeneratePayrollDto = z.infer<typeof GeneratePayrollBodySchema>;
