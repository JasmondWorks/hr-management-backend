import { z } from "zod";
import { registry } from "../../core/docs/registry";

export const JobResponseSchema = registry.register(
  "Job",
  z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    description: z.string(),
    amount: z.string(),
    workLocation: z.enum(["ON_SITE", "REMOTE", "HYBRID"]),
    contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
    contractDuration: z.string().nullable().optional(),
    status: z.enum(["OPEN", "CLOSED"]),
    departmentId: z.string().uuid(),
    departmentDesignationId: z.string().uuid(),
    officeBranchId: z.string().uuid().nullable().optional(),
  }),
);

export const CreateJobBodySchema = registry.register(
  "CreateJobInput",
  z.object({
    departmentId: z.string().uuid("Invalid department ID format"),
    name: z.string().min(2).optional(),
    description: z
      .string({ message: "Job description is required" })
      .min(2, "Job description must be at least 2 characters long"),
    amount: z
      .string({ message: "Amount is required" })
      .min(1, "Amount is required"),
    workLocation: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).optional(),
    contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
    contractDuration: z.string().optional(),
    // Job title / role within the department; created or reused by name.
    designation: z
      .string({ message: "Designation is required" })
      .min(2, "Designation must be at least 2 characters long"),
    // Optional: the branch this job is located at. Must belong to your org.
    officeBranchId: z.string().uuid("Invalid office branch ID format").optional(),
  }),
);

export const UpdateJobBodySchema = registry.register(
  "UpdateJobInput",
  z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    amount: z.string().min(1).optional(),
    workLocation: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).optional(),
    contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
    contractDuration: z.string().optional(),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
    designation: z.string().min(2).optional(),
    // null clears the branch association; omitting the key leaves it unchanged.
    officeBranchId: z
      .string()
      .uuid("Invalid office branch ID format")
      .nullable()
      .optional(),
  }),
);

export const getJobsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    officeBranchId: z.string().uuid().optional(),
    workLocation: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).optional(),
    contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
    status: z.enum(["OPEN", "CLOSED"]).optional(),
  }),
});

export const jobIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid job ID format (must be UUID)"),
  }),
});

export const createJobSchema = z.object({ body: CreateJobBodySchema });
export const updateJobSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid job ID format (must be UUID)") }),
  body: UpdateJobBodySchema,
});

export type CreateJobDto = z.infer<typeof CreateJobBodySchema>;
export type UpdateJobDto = z.infer<typeof UpdateJobBodySchema>;
