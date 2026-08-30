import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const EmployeeResponseSchema = registry.register(
  "Employee",
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    organizationId: z.string().uuid(),
    departmentId: z.string().uuid().nullable(),
    designationId: z.string().uuid().nullable(),
    officeBranchId: z.string().uuid().nullable(),
    salary: z.number().nullable(),
    joiningDate: z.string().nullable(),
    employeeType: z
      .enum(["FULL_TIME", "PART_TIME", "CONTRACTOR"])
      .nullable(),
    workLocation: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const getEmployeesSchema = z.object({
  query: paginationQuerySchema,
});

export const getEmployeeByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Employee ID format (must be UUID)"),
  }),
});

// Assign / move an employee to a department (null clears the assignment).
export const AssignDepartmentBodySchema = registry.register(
  "AssignDepartmentInput",
  z.object({
    departmentId: z
      .string()
      .uuid("Invalid department ID format")
      .nullable(),
    // Optional job title within that department. Cleared when omitted, since a
    // designation from the previous department would no longer apply.
    designationId: z
      .string()
      .uuid("Invalid designation ID format")
      .optional(),
  }),
);

export const assignDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Employee ID format (must be UUID)"),
  }),
  body: AssignDepartmentBodySchema,
});

export const SetSalaryBodySchema = registry.register(
  "SetSalaryInput",
  z.object({
    salary: z.number().positive("Salary must be positive"),
  }),
);

export const setSalarySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Employee ID format (must be UUID)"),
  }),
  body: SetSalaryBodySchema,
});

export const UpdateBusinessRoleBodySchema = registry.register(
  "UpdateBusinessRoleInput",
  z.object({
    businessRole: z.enum(["REGULAR", "DEPARTMENT_ADMIN", "HR", "ORGANIZATION_ADMIN"]),
  })
);

export const updateBusinessRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Employee ID format (must be UUID)"),
  }),
  body: UpdateBusinessRoleBodySchema,
});

export type AssignDepartmentDto = z.infer<typeof AssignDepartmentBodySchema>;
export type SetSalaryDto = z.infer<typeof SetSalaryBodySchema>;
export type UpdateBusinessRoleDto = z.infer<typeof UpdateBusinessRoleBodySchema>;
