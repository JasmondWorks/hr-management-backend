import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

const PROJECT_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export const ProjectResponseSchema = registry.register(
  "Project",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    startDate: z.string(),
    finishDate: z.string().nullable(),
    status: z.enum(PROJECT_STATUSES),
    timeline: z.string().nullable(),
    organizationId: z.string().uuid(),
    createdById: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const CreateProjectBodySchema = registry.register(
  "CreateProjectInput",
  z.object({
    name: z
      .string({ message: "Project name is required" })
      .min(2, "Project name must be at least 2 characters long"),
    startDate: z.coerce.date(),
    finishDate: z.coerce.date().optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    timeline: z.string().optional(),
    // Employees (by id) to assign as collaborators; must be in your org.
    collaboratorIds: z.array(z.string().uuid()).optional(),
  }),
);

export const UpdateProjectBodySchema = registry.register(
  "UpdateProjectInput",
  z.object({
    name: z.string().min(2).optional(),
    startDate: z.coerce.date().optional(),
    finishDate: z.coerce.date().nullable().optional(),
    timeline: z.string().nullable().optional(),
  }),
);

export const UpdateProjectStatusBodySchema = registry.register(
  "UpdateProjectStatusInput",
  z.object({
    status: z.enum(PROJECT_STATUSES),
  }),
);

export const AddCollaboratorsBodySchema = registry.register(
  "AddCollaboratorsInput",
  z.object({
    employeeIds: z.array(z.string().uuid()).min(1, "Provide at least one employee"),
  }),
);

export const createProjectSchema = z.object({ body: CreateProjectBodySchema });
export const projectIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid project ID (must be UUID)") }),
});
export const updateProjectSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid project ID (must be UUID)") }),
  body: UpdateProjectBodySchema,
});
export const updateProjectStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid project ID (must be UUID)") }),
  body: UpdateProjectStatusBodySchema,
});
export const addCollaboratorsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid project ID (must be UUID)") }),
  body: AddCollaboratorsBodySchema,
});
export const removeCollaboratorSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project ID (must be UUID)"),
    employeeId: z.string().uuid("Invalid employee ID (must be UUID)"),
  }),
});
export const getProjectsSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(PROJECT_STATUSES).optional(),
    employeeId: z.string().uuid().optional(),
  }),
});

export type CreateProjectDto = z.infer<typeof CreateProjectBodySchema>;
export type UpdateProjectDto = z.infer<typeof UpdateProjectBodySchema>;
