import { registry } from "../../core/docs/registry";
import {
  CreateProjectBodySchema,
  UpdateProjectBodySchema,
  UpdateProjectStatusBodySchema,
  AddCollaboratorsBodySchema,
  ProjectResponseSchema,
} from "./project.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

const idParam = z.object({
  id: z.string().uuid().openapi({ description: "Project UUID" }),
});
const dataResponse = (description: string) => ({
  200: {
    description,
    content: {
      "application/json": {
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
          data: ProjectResponseSchema,
        }),
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/projects",
  summary: "List organization projects",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      status: z
        .enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"])
        .optional(),
    }),
  },
  responses: {
    200: {
      description: "Projects retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(ProjectResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/mine",
  summary: "List projects I collaborate on (employee)",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      status: z
        .enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"])
        .optional(),
    }),
  },
  responses: {
    200: {
      description: "Projects retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(ProjectResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{id}",
  summary: "Get a project (with collaborators)",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    ...dataResponse("Project retrieved"),
    404: { description: "Project not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/projects",
  summary: "Create a project (admin only)",
  description:
    "Creates a project in your organization. Requires DEPARTMENT_ADMIN, HR, or organization admin. Optionally assign collaborators (employees in your org).",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateProjectBodySchema } },
    },
  },
  responses: {
    201: { description: "Project created" },
    400: { description: "Invalid dates or collaborators not in your org" },
    403: { description: "Insufficient role" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/projects/{id}",
  summary: "Update project details (admin only)",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
    body: {
      required: true,
      content: { "application/json": { schema: UpdateProjectBodySchema } },
    },
  },
  responses: dataResponse("Project updated"),
});

registry.registerPath({
  method: "patch",
  path: "/projects/{id}/status",
  summary: "Change project status (admin only)",
  description: "Mutates the project status and notifies collaborators.",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
    body: {
      required: true,
      content: {
        "application/json": { schema: UpdateProjectStatusBodySchema },
      },
    },
  },
  responses: dataResponse("Project status updated"),
});

registry.registerPath({
  method: "post",
  path: "/projects/{id}/collaborators",
  summary: "Add collaborators to a project (admin only)",
  description: "Assigns employees (in your org) to the project and notifies them.",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
    body: {
      required: true,
      content: { "application/json": { schema: AddCollaboratorsBodySchema } },
    },
  },
  responses: dataResponse("Collaborators added"),
});

registry.registerPath({
  method: "delete",
  path: "/projects/{id}/collaborators/{employeeId}",
  summary: "Remove a collaborator from a project (admin only)",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Project UUID" }),
      employeeId: z.string().uuid().openapi({ description: "Employee UUID" }),
    }),
  },
  responses: dataResponse("Collaborator removed"),
});

registry.registerPath({
  method: "delete",
  path: "/projects/{id}",
  summary: "Delete a project (admin only)",
  tags: ["Projects"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Project deleted" },
    404: { description: "Project not found" },
  },
});
