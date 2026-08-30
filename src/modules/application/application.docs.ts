import { registry } from "../../core/docs/registry";
import {
  CreateApplicationBodySchema,
  ApplicationResponseSchema,
} from "./application.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/applications",
  summary: "Apply to a job (candidate)",
  description:
    "The logged-in CANDIDATE applies to an open job. Creates an application with status APPLIED.",
  tags: ["Applications"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateApplicationBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Application submitted",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: ApplicationResponseSchema,
          }),
        },
      },
    },
    400: { description: "Job is not open for applications" },
    404: { description: "Job or candidate profile not found" },
    409: { description: "Already applied to this job" },
  },
});

registry.registerPath({
  method: "get",
  path: "/applications/mine",
  summary: "List candidate's own applications",
  description: "Allows the logged-in CANDIDATE to list their own submitted job applications.",
  tags: ["Applications"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Candidate's own applications retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(ApplicationResponseSchema),
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
    404: { description: "Candidate profile not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/applications",
  summary: "List applications to the admin's organization",
  tags: ["Applications"],
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Applications retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(ApplicationResponseSchema),
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
  method: "post",
  path: "/applications/{id}/accept",
  summary: "Accept an application; promote candidate to employee",
  description:
    "Organization admin accepts an application for one of their org's jobs. Marks it ACCEPTED, promotes the candidate's user to EMPLOYEE of the org, creates the Employee record, and closes the candidate's other open applications.",
  tags: ["Applications"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Application UUID" }),
    }),
  },
  responses: {
    200: { description: "Application accepted; candidate promoted" },
    400: { description: "Application already accepted or rejected" },
    403: { description: "Application is not for your organization" },
    404: { description: "Application not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/applications/{id}/reject",
  summary: "Reject an application",
  tags: ["Applications"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Application UUID" }),
    }),
  },
  responses: {
    200: { description: "Application rejected" },
    400: { description: "Application already accepted or rejected" },
    403: { description: "Application is not for your organization" },
    404: { description: "Application not found" },
  },
});
