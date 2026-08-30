import { registry } from "../../core/docs/registry";
import {
  CreateDepartmentBodySchema,
  DepartmentResponseSchema,
} from "./department.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/departments",
  summary: "Create a department (department admin)",
  description:
    "Creates a department in the logged-in user's organization. Requires business role DEPARTMENT_ADMIN (organization admins are also allowed).",
  tags: ["Departments"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateDepartmentBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Department created",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: DepartmentResponseSchema,
          }),
        },
      },
    },
    400: { description: "You are not part of any organization" },
    403: { description: "Insufficient role" },
    409: { description: "Department name already exists in your organization" },
  },
});

registry.registerPath({
  method: "get",
  path: "/departments",
  summary: "List departments in your organization",
  tags: ["Departments"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Departments retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(DepartmentResponseSchema),
          }),
        },
      },
    },
  },
});
