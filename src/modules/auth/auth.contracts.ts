import { s } from "../../core/framework";
import type { Contract } from "../../core/framework";

// ─────────────────────────────────────────────────────────────────────────────
// Shared schemas (reused across contracts via spread or $ref)
// ─────────────────────────────────────────────────────────────────────────────

const UserResponseSchema = s.object({
  id: s.string().uuid(),
  email: s.string().email(),
  firstName: s.string(),
  lastName: s.string(),
  phone: s.string(),
  role: s.string().oneOf(["CANDIDATE", "EMPLOYEE", "ORGANIZATION_ADMIN", "DEPARTMENT_ADMIN"]),
  isEmailVerified: s.boolean(),
  createdAt: s.string().dateTime(),
  updatedAt: s.string().dateTime(),
});

const TokensSchema = s.object({
  accessToken: s.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Contracts
// ─────────────────────────────────────────────────────────────────────────────

export const registerContract = {
  method: "POST",
  path: "/register",
  summary: "Register a new user",
  tags: ["Authentication"],
  auth: false,

  body: s.object({
    email: s.string().email().describe("User email address"),
    password: s.string().min(8).describe("Password — minimum 8 characters"),
    firstName: s.string().min(2),
    lastName: s.string().min(2),
    phone: s.string().min(7),
  }),

  response: {
    201: s.object({
      success: s.boolean(),
      message: s.string(),
      data: UserResponseSchema,
    }),
  },
} satisfies Contract;

export const loginContract = {
  method: "POST",
  path: "/login",
  summary: "Login with email and password",
  tags: ["Authentication"],
  auth: false,

  body: s.object({
    email: s.string().email(),
    password: s.string().min(1),
  }),

  response: {
    200: s.object({
      success: s.boolean(),
      message: s.string(),
      data: UserResponseSchema,
    }),
  },
} satisfies Contract;

export const logoutContract = {
  method: "POST",
  path: "/logout",
  summary: "Logout current user",
  description: "Clears the access_token and refresh_token cookies.",
  tags: ["Authentication"],
  auth: true,

  response: {
    200: s.object({
      success: s.boolean(),
      message: s.string(),
    }),
  },
} satisfies Contract;

export const refreshContract = {
  method: "POST",
  path: "/refresh",
  summary: "Refresh access token",
  description: "Uses the refresh_token cookie to issue new tokens.",
  tags: ["Authentication"],
  auth: false,

  response: {
    200: s.object({
      success: s.boolean(),
      data: TokensSchema,
    }),
  },
} satisfies Contract;

export const authContracts = [
  registerContract,
  loginContract,
  logoutContract,
  refreshContract,
];
