import { s } from "../../core/framework";
import type { Contract } from "../../core/framework";

// ─────────────────────────────────────────────────────────────────────────────
// Shared schemas
// ─────────────────────────────────────────────────────────────────────────────

const UserSchema = s.object({
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

// ─────────────────────────────────────────────────────────────────────────────
// Contracts
// ─────────────────────────────────────────────────────────────────────────────

export const getUsersContract = {
  method: "GET",
  path: "/",
  summary: "List all users",
  tags: ["Users"],
  auth: true,

  query: s.object({
    page: s.string().optional(),
    limit: s.string().optional(),
  }),

  response: {
    200: s.object({
      success: s.boolean(),
      message: s.string(),
      data: s.array(UserSchema),
    }),
  },
} satisfies Contract;

export const getUserByIdContract = {
  method: "GET",
  path: "/:id",
  summary: "Get a user by ID",
  tags: ["Users"],
  auth: true,

  params: s.object({
    id: s.string().uuid(),
  }),

  response: {
    200: s.object({
      success: s.boolean(),
      message: s.string(),
      data: UserSchema,
    }),
    404: s.object({
      success: s.boolean(),
      error: s.object({ message: s.string() }),
    }),
  },
} satisfies Contract;

export const deleteUserContract = {
  method: "DELETE",
  path: "/:id",
  summary: "Delete a user by ID",
  tags: ["Users"],
  auth: true,

  params: s.object({
    id: s.string().uuid(),
  }),

  response: {
    200: s.object({
      success: s.boolean(),
      message: s.string(),
    }),
    404: s.object({
      success: s.boolean(),
      error: s.object({ message: s.string() }),
    }),
  },
} satisfies Contract;

export const userContracts = [
  getUsersContract,
  getUserByIdContract,
  deleteUserContract,
];
