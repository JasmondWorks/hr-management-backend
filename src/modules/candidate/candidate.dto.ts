import { z } from "zod";
import { registry } from "../../core/docs/registry";

// Candidate Profile Schema
export const CandidateProfileSchema = registry.register(
  "CandidateProfile",
  z.object({
    id: z.string().uuid(),
    candidateId: z.string().uuid(),
    resumeUrl: z.string().nullable(),
    skills: z.string().nullable(),
  }),
);

// Output Candidate Schema
export const CandidateSchema = registry.register(
  "Candidate",
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    candidateProfile: CandidateProfileSchema.nullable().optional(),
  }),
);

// Swagger Register Candidate Body Schema (including binary file upload)
export const RegisterCandidateBodySchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address"),
  firstName: z
    .string({ message: "First name is required" })
    .min(2, "First name must be at least 2 characters long"),
  lastName: z
    .string({ message: "Last name is required" })
    .min(2, "Last name must be at least 2 characters long"),
  skills: z.string().optional(),
  resume: z
    .string()
    .openapi({
      type: "string",
      format: "binary",
      description: "Candidate's resume (PDF file)",
    })
    .optional(),
});

// Express Validation Schema (Excludes the binary file since it is handled by Multer)
export const registerCandidateSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address"),
    firstName: z
      .string({ message: "First name is required" })
      .min(2, "First name must be at least 2 characters long"),
    lastName: z
      .string({ message: "Last name is required" })
      .min(2, "Last name must be at least 2 characters long"),
    skills: z.string().optional(),
  }),
});
