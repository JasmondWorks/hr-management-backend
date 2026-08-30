import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const DepartmentResponseSchema = registry.register(
  "Department",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    organizationId: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const CreateDepartmentBodySchema = registry.register(
  "CreateDepartmentInput",
  z.object({
    name: z
      .string({ message: "Department name is required" })
      .min(2, "Department name must be at least 2 characters long"),
    description: z.string().optional(),
    location: z.string().optional(),
  }),
);

export const createDepartmentSchema = z.object({
  body: CreateDepartmentBodySchema,
});

export const getDepartmentsSchema = z.object({
  query: paginationQuerySchema,
});

export type CreateDepartmentDto = z.infer<typeof CreateDepartmentBodySchema>;
