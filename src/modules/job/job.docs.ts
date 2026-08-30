import { registry } from "../../core/docs/registry";
import {
  CreateJobBodySchema,
  UpdateJobBodySchema,
  JobResponseSchema,
} from "./job.dto";
import { z } from "zod";

const jobIdParam = z.object({
  id: z.string().uuid().openapi({ description: "Job UUID" }),
});

const listQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  workArrangement: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

registry.registerPath({
  method: "get",
  path: "/jobs",
  summary: "List / browse OPEN jobs across all organizations (public/candidate)",
  description:
    "Candidates (or any user) browse OPEN jobs across all organizations. Used for the public job board.",
  tags: ["Jobs"],
  request: { query: listQuery },
  responses: {
    200: {
      description: "Jobs retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(JobResponseSchema),
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
  path: "/jobs/mine",
  summary: "List jobs for the authenticated organization",
  description:
    "Organization members get their organization's jobs (any status, filterable by query params). Requires the user to belong to an organization.",
  tags: ["Jobs"],
  security: [{ bearerAuth: [] }],
  request: { query: listQuery },
  responses: {
    200: {
      description: "My jobs retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(JobResponseSchema),
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
    403: { description: "You are not part of any organization" },
  },
});

registry.registerPath({
  method: "get",
  path: "/jobs/{id}",
  summary: "Get a job by ID",
  tags: ["Jobs"],
  request: { params: jobIdParam },
  responses: {
    200: {
      description: "Job retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: JobResponseSchema,
          }),
        },
      },
    },
    404: { description: "Job not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/jobs",
  summary: "Create a job (department admin)",
  description:
    "Creates a job under a department your organization owns (departmentId in the body). The `designation` title is created or reused within that department. Requires business role DEPARTMENT_ADMIN.",
  tags: ["Jobs"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateJobBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Job created",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: JobResponseSchema,
          }),
        },
      },
    },
    400: { description: "You are not part of any organization" },
    403: { description: "Department is not part of your organization" },
    404: { description: "Department not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/jobs/{id}",
  summary: "Update a job (department admin)",
  description:
    "Update job fields or open/close it (status). Requires business role DEPARTMENT_ADMIN and ownership of the job's organization.",
  tags: ["Jobs"],
  security: [{ bearerAuth: [] }],
  request: {
    params: jobIdParam,
    body: {
      required: true,
      content: { "application/json": { schema: UpdateJobBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Job updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: JobResponseSchema,
          }),
        },
      },
    },
    403: { description: "Job is not part of your organization" },
    404: { description: "Job not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/jobs/{id}",
  summary: "Delete a job (department admin)",
  tags: ["Jobs"],
  security: [{ bearerAuth: [] }],
  request: { params: jobIdParam },
  responses: {
    200: { description: "Job deleted" },
    403: { description: "Job is not part of your organization" },
    404: { description: "Job not found" },
  },
});
