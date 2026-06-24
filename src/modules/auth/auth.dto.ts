import { z } from "zod";
import { registry } from "../../core/docs/registry";

// Reusable payload schemas registered in components
export const RegisterBodySchema = registry.register(
  "RegisterInput",
  z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address"),
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

export const LoginBodySchema = registry.register(
  "LoginInput",
  z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address"),
    password: z
      .string({ message: "Password is required" })
      .min(1, "Password is required"),
  }),
);

// Express validation wrappers
export const registerSchema = z.object({
  body: RegisterBodySchema,
});

export const loginSchema = z.object({
  body: LoginBodySchema,
});
