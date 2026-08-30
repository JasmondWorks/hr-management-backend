import { registry } from "../../core/docs/registry";
import {
  CompleteOnboardingBodySchema,
  OnboardingContextResponseSchema,
} from "./onboarding.dto";
import { z } from "zod";

registry.registerPath({
  method: "get",
  path: "/me/onboarding",
  summary: "Get your onboarding context",
  description:
    "Returns the org-side facts an admin already set (organization, department, designation, branch) plus whatever personal details you have saved. The frontend shows the org-side block read-only.",
  tags: ["Onboarding"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Onboarding context retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OnboardingContextResponseSchema,
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/me/onboarding/complete",
  summary: "Mark onboarding finished (organization admin)",
  description:
    "Sets isOnboarded for a caller whose flow has no personal-details form — the organization admin wizard. Refused until they have an organization.",
  tags: ["Onboarding"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Onboarding completed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OnboardingContextResponseSchema,
          }),
        },
      },
    },
    400: { description: "No organization yet" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/me/onboarding",
  summary: "Complete your onboarding",
  description:
    "Saves the employee's own personal details and sets isOnboarded. Org-side fields cannot be set here.",
  tags: ["Onboarding"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CompleteOnboardingBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Onboarding completed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OnboardingContextResponseSchema,
          }),
        },
      },
    },
    400: { description: "You are not part of any organization" },
  },
});
