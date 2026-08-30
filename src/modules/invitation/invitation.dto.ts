import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

const businessRoleEnum = z.enum([
  "REGULAR",
  "DEPARTMENT_ADMIN",
  "HR",
  "ORGANIZATION_ADMIN",
]);

export const InvitationResponseSchema = registry.register(
  "EmployeeInvitation",
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    organizationId: z.string().uuid(),
    departmentId: z.string().uuid().nullable(),
    designationId: z.string().uuid().nullable(),
    officeBranchId: z.string().uuid().nullable(),
    businessRole: businessRoleEnum,
    status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]),
    invitedById: z.string().uuid(),
    acceptedAt: z.string().nullable(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

// The context an admin may attach to an invitation. Everything except the email
// is optional — the admin can fill these in later from the employee's record.
export const CreateInvitationBodySchema = registry.register(
  "CreateInvitationInput",
  z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address"),
    departmentId: z.string().uuid("Invalid department ID format").optional(),
    designationId: z.string().uuid("Invalid designation ID format").optional(),
    officeBranchId: z.string().uuid("Invalid office branch ID format").optional(),
    businessRole: businessRoleEnum.optional().default("REGULAR"),
  }),
);

export const BulkCreateInvitationBodySchema = registry.register(
  "BulkCreateInvitationInput",
  z.object({
    invitations: z
      .array(CreateInvitationBodySchema)
      .min(1, "Provide at least one invitation")
      .max(50, "You can invite at most 50 people at a time"),
  }),
);

export const CheckInvitationBodySchema = registry.register(
  "CheckInvitationInput",
  z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address"),
  }),
);

export const createInvitationSchema = z.object({
  body: CreateInvitationBodySchema,
});

export const bulkCreateInvitationSchema = z.object({
  body: BulkCreateInvitationBodySchema,
});

export const checkInvitationSchema = z.object({
  body: CheckInvitationBodySchema,
});

export const getInvitationsSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]).optional(),
  }),
});

export const invitationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid invitation ID format (must be UUID)"),
  }),
});

// --- public (pre-account) schemas ---

export const verifyInvitationSchema = z.object({
  query: z.object({
    token: z.string({ message: "Token is required" }).min(1, "Token is required"),
  }),
});

export const AcceptInvitationBodySchema = registry.register(
  "AcceptInvitationInput",
  z.object({
    token: z.string({ message: "Token is required" }).min(1, "Token is required"),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters long"),
    firstName: z
      .string({ message: "First name is required" })
      .min(2, "First name must be at least 2 characters long"),
    lastName: z
      .string({ message: "Last name is required" })
      .min(2, "Last name must be at least 2 characters long"),
    phone: z
      .string({ message: "Phone number is required" })
      .min(7, "Phone number must be at least 7 characters long"),
  }),
);

export const acceptInvitationSchema = z.object({
  body: AcceptInvitationBodySchema,
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationBodySchema>;
export type BulkCreateInvitationDto = z.infer<typeof BulkCreateInvitationBodySchema>;
export type AcceptInvitationDto = z.infer<typeof AcceptInvitationBodySchema>;
