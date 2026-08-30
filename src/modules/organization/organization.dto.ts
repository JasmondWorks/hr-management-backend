import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const OrganizationResponseSchema = registry.register(
  "Organization",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    zipCode: z.string(),
    logoUrl: z.string().nullable(),
    websiteUrl: z.string().nullable(),
    description: z.string().nullable(),
    attendanceCheckOutTime: z.string(),
    creatorId: z.string().uuid(),
    creator: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      role: z.string(),
      isEmailVerified: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const getOrganizationsSchema = z.object({
  query: paginationQuerySchema,
});

export const getOrganizationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid organization ID format (must be UUID)"),
  }),
});

export const CreateOrganizationBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  zipCode: z.string(),
  logoUrl: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const createOrganizationSchema = z.object({
  body: CreateOrganizationBodySchema,
});

export const AddUserToOrgBodySchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export const addUserToOrgSchema = z.object({
  body: AddUserToOrgBodySchema,
});

// 24-hour "HH:MM" time (00:00–23:59).
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in 24h HH:MM format");

export const UpdateOrganizationBodySchema = registry.register(
  "UpdateOrganizationInput",
  z.object({
    name: z.string().min(2).nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    zipCode: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    websiteUrl: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    attendanceCheckOutTime: timeString.nullable().optional(),
  }),
);

export const updateOrganizationSchema = z.object({
  body: UpdateOrganizationBodySchema,
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationBodySchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationBodySchema>;
export type GetOrganizationsQueryDto = z.infer<
  typeof getOrganizationsSchema
>["query"];
export type GetOrganizationByIdParamsDto = z.infer<
  typeof getOrganizationByIdSchema
>["params"];
