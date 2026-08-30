import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const OfficeBranchResponseSchema = registry.register(
  "OfficeBranch",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    zipCode: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    isHeadquarters: z.boolean(),
    organizationId: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const CreateOfficeBranchBodySchema = registry.register(
  "CreateOfficeBranchInput",
  z.object({
    name: z
      .string({ message: "Branch name is required" })
      .min(2, "Branch name must be at least 2 characters long"),
    address: z.string({ message: "Address is required" }).min(1, "Address is required"),
    country: z.string({ message: "Country is required" }).min(1, "Country is required"),
    state: z.string({ message: "State is required" }).min(1, "State is required"),
    city: z.string({ message: "City is required" }).min(1, "City is required"),
    zipCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    isHeadquarters: z.boolean().optional().default(false),
  }),
);

export const UpdateOfficeBranchBodySchema = registry.register(
  "UpdateOfficeBranchInput",
  CreateOfficeBranchBodySchema.partial(),
);

export const createOfficeBranchSchema = z.object({
  body: CreateOfficeBranchBodySchema,
});

export const getOfficeBranchesSchema = z.object({
  query: paginationQuerySchema,
});

export const officeBranchIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid office branch ID format (must be UUID)"),
  }),
});

export const updateOfficeBranchSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid office branch ID format (must be UUID)"),
  }),
  body: UpdateOfficeBranchBodySchema,
});

export type CreateOfficeBranchDto = z.infer<typeof CreateOfficeBranchBodySchema>;
export type UpdateOfficeBranchDto = z.infer<typeof UpdateOfficeBranchBodySchema>;
