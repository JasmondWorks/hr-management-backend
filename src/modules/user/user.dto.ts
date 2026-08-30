import { z } from "zod";
import { registry } from "../../core/docs/registry";
import { paginationQuerySchema } from "../../core/dto/query.dto";

export const UserSchema = registry.register(
  "User",
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    role: z.string(),
    isEmailVerified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);

export const getUsersSchema = z.object({
  query: paginationQuerySchema,
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format (must be UUID)"),
  }),
});
