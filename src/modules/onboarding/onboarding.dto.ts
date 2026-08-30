import { z } from "zod";
import { registry } from "../../core/docs/registry";

// Everything here is supplied by the employee about themselves. Org-side facts
// (department, designation, branch, salary, business role) are deliberately
// absent — those belong to the admin and are prefilled from the invitation.
export const CompleteOnboardingBodySchema = registry.register(
  "CompleteOnboardingInput",
  z.object({
    firstName: z
      .string({ message: "First name is required" })
      .min(2, "First name must be at least 2 characters long"),
    lastName: z
      .string({ message: "Last name is required" })
      .min(2, "Last name must be at least 2 characters long"),
    phone: z
      .string({ message: "Phone number is required" })
      .min(7, "Phone number must be at least 7 characters long"),

    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    maritalStatus: z
      .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"])
      .optional(),

    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),

    avatarUrl: z.string().url("Invalid URL").optional(),

    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    emergencyContactRelationship: z.string().optional(),
  }),
);

export const completeOnboardingSchema = z.object({
  body: CompleteOnboardingBodySchema,
});

export const OnboardingContextResponseSchema = registry.register(
  "OnboardingContext",
  z.object({
    isOnboarded: z.boolean(),
    onboardedAt: z.string().nullable(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      businessRole: z.string().nullable(),
    }),
    organization: z
      .object({ id: z.string().uuid(), name: z.string() })
      .nullable(),
    department: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
    designation: z
      .object({ id: z.string().uuid(), name: z.string() })
      .nullable(),
    officeBranch: z
      .object({ id: z.string().uuid(), name: z.string() })
      .nullable(),
    joiningDate: z.string().nullable(),
    profile: z.record(z.string(), z.unknown()).nullable(),
  }),
);

export type CompleteOnboardingDto = z.infer<typeof CompleteOnboardingBodySchema>;
