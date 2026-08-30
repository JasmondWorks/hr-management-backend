import { registry } from "../../core/docs/registry";
import {
  EmployeeResponseSchema,
  AssignDepartmentBodySchema,
  SetSalaryBodySchema,
} from "./employee.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

registry.registerPath({
  method: "patch",
  path: "/employees/{id}/salary",
  summary: "Set an employee's monthly salary (org admin)",
  description: "Sets the employee's salary used for payroll generation.",
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Employee UUID" }),
    }),
    body: {
      required: true,
      content: { "application/json": { schema: SetSalaryBodySchema } },
    },
  },
  responses: {
    200: { description: "Employee salary updated" },
    403: { description: "Employee not in your organization" },
    404: { description: "Employee not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/employees/{id}/department",
  summary: "Assign or move an employee to a department",
  description:
    "Sets the employee's single department (or clears it with null). The employee and department must both belong to your organization. ORGANIZATION_ADMIN only.",
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Employee UUID" }),
    }),
    body: {
      required: true,
      content: {
        "application/json": { schema: AssignDepartmentBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Employee department updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: EmployeeResponseSchema,
          }),
        },
      },
    },
    403: { description: "Employee or department not in your organization" },
    404: { description: "Employee or department not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/employees",
  summary: "List all employees",
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: {
      description: "Employees retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(EmployeeResponseSchema),
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
  path: "/employees/{id}",
  summary: "Get an employee by ID",
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Employee UUID" }),
    }),
  },
  responses: {
    200: {
      description: "Employee retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: EmployeeResponseSchema,
          }),
        },
      },
    },
    404: { description: "Employee not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/employees/{id}",
  summary: "Delete an employee by ID",
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Employee UUID" }),
    }),
  },
  responses: {
    200: {
      description: "Employee deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    404: { description: "Employee not found" },
  },
});
