import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const ApplicationResponseSchema = registry.register(
  "Application",
  z.object({
    id: z.string().uuid(),
    jobId: z.string().uuid(),
    candidateId: z.string().uuid(),
    status: z.enum([
      "APPLIED",
      "INTERVIEW",
      "OFFERED",
      "ACCEPTED",
      "REJECTED",
    ]),
    appliedAt: z.string(),
  }),
);

export const CreateApplicationBodySchema = registry.register(
  "CreateApplicationInput",
  z.object({
    jobId: z.string().uuid("Invalid job ID format"),
  }),
);

export const createApplicationSchema = z.object({
  body: CreateApplicationBodySchema,
});

export const applicationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid application ID format (must be UUID)"),
  }),
});

export const getApplicationsSchema = z.object({
  query: paginationQuerySchema,
});

export type CreateApplicationDto = z.infer<typeof CreateApplicationBodySchema>;
