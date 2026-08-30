import { registry } from "../../core/docs/registry";
import {
  LoginBodySchema,
  RefreshTokenBodySchema,
  RegisterBodySchema,
} from "./auth.dto";
import { z } from "zod";

const registerSuccessResponse = {
  201: {
    description: "User registered successfully",
    content: {
      "application/json": {
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.object({}),
        }),
      },
    },
  },
  400: { description: "Validation error" },
  409: { description: "Email already in use" },
};

registry.registerPath({
  method: "post",
  path: "/auth/register/organization-admin",
  summary: "Register a new organization admin user account",
  description:
    "Creates a user account with the EMPLOYEE role and ORGANIZATION_ADMIN business role. The organization entity is created separately during onboarding via POST /organizations once logged in.",
  tags: ["Authentication"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: registerSuccessResponse,
});

registry.registerPath({
  method: "post",
  path: "/auth/register/employee",
  summary: "Register a new employee user account",
  description:
    "Creates a user account with the EMPLOYEE role. The employee entity is created separately during onboarding via POST /employees once logged in.",
  tags: ["Authentication"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: registerSuccessResponse,
});

registry.registerPath({
  method: "post",
  path: "/auth/register/candidate",
  summary: "Register a new candidate user account",
  description:
    "Creates a user account with the CANDIDATE role. The candidate profile entity is created separately during onboarding once logged in.",
  tags: ["Authentication"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: registerSuccessResponse,
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  summary: "Login with email and password",
  tags: ["Authentication"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: LoginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({}),
          }),
        },
      },
    },
    401: { description: "Invalid email or password" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  summary: "Logout current user",
  tags: ["Authentication"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Logged out successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  summary: "Refresh access token",
  tags: ["Authentication"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: RefreshTokenBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tokens refreshed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    401: { description: "Invalid or expired refresh token" },
  },
});
