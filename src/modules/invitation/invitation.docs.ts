import { registry } from "../../core/docs/registry";
import {
  CreateInvitationBodySchema,
  BulkCreateInvitationBodySchema,
  AcceptInvitationBodySchema,
  InvitationResponseSchema,
} from "./invitation.dto";
import { paginationQuerySchema } from "../../core/dto/query.dto";
import { z } from "zod";

const idParam = z.object({
  id: z.string().uuid().openapi({ description: "Invitation ID" }),
});

registry.registerPath({
  method: "post",
  path: "/invitations",
  summary: "Invite an employee by email (organization admin)",
  description:
    "Creates a pending invitation and emails a single-use link that expires in 7 days. No user account is created until the invitation is accepted.",
  tags: ["Invitations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateInvitationBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Invitation sent",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: InvitationResponseSchema,
          }),
        },
      },
    },
    400: { description: "You are not part of any organization" },
    403: { description: "Insufficient role" },
    404: { description: "Department, designation or office branch not found" },
    409: { description: "Already a member, or a pending invitation exists" },
  },
});

registry.registerPath({
  method: "post",
  path: "/invitations/bulk",
  summary: "Invite several employees at once (organization admin)",
  description:
    "Processes each invitation independently and reports per-email outcomes, so one bad address does not discard the rest.",
  tags: ["Invitations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: BulkCreateInvitationBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Batch processed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(
              z.object({
                email: z.string(),
                status: z.enum(["invited", "failed"]),
                reason: z.string().optional(),
              }),
            ),
          }),
        },
      },
    },
    403: { description: "Insufficient role" },
  },
});

registry.registerPath({
  method: "get",
  path: "/invitations",
  summary: "List invitations in your organization (organization admin)",
  tags: ["Invitations"],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationQuerySchema.extend({
      status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Invitations retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(InvitationResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/invitations/{id}/resend",
  summary: "Resend an invitation (organization admin)",
  description:
    "Issues a new token and expiry. The previously emailed link stops working.",
  tags: ["Invitations"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Invitation resent" },
    404: { description: "Invitation not found" },
    409: { description: "Invitation already accepted" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/invitations/{id}",
  summary: "Revoke an invitation (organization admin)",
  description: "Immediately invalidates the emailed link.",
  tags: ["Invitations"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Invitation revoked" },
    404: { description: "Invitation not found" },
    409: { description: "Invitation already accepted" },
  },
});

registry.registerPath({
  method: "get",
  path: "/invitations/verify",
  summary: "Verify an invitation token (public)",
  description:
    "Returns the organization context behind a link so the accept page can show who is inviting whom. Public — the invitee has no account yet.",
  tags: ["Invitations"],
  request: { query: z.object({ token: z.string() }) },
  responses: {
    200: {
      description: "Invitation valid",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              email: z.string().email(),
              organizationName: z.string(),
              departmentName: z.string().nullable(),
              designationName: z.string().nullable(),
              officeBranchName: z.string().nullable(),
              businessRole: z.string(),
              expiresAt: z.string(),
            }),
          }),
        },
      },
    },
    410: { description: "Link expired, already used, or revoked" },
  },
});

registry.registerPath({
  method: "post",
  path: "/invitations/accept",
  summary: "Accept an invitation and create the account (public)",
  description:
    "Consumes the token, creates the user and employee from the invitation's context, and returns a session. The link cannot be used again.",
  tags: ["Invitations"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: AcceptInvitationBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Invitation accepted; session returned",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              user: z.record(z.string(), z.unknown()),
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          }),
        },
      },
    },
    409: { description: "An account already exists for this email" },
    410: { description: "Link expired, already used, or revoked" },
  },
});
