import { registry } from "../../core/docs/registry";
import { RegisterBodySchema, LoginBodySchema } from "./auth.dto";
import { z } from "zod";

registry.registerPath({
  method: "post",
  path: "/auth/register",
  summary: "Register a new user",
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
  responses: {
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
  },
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
