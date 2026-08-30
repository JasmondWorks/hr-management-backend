import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { sendMail } from "../../core/utils/mail";
import { employeeInviteEmail } from "../../core/templates/employee-invite";
import { envConfig } from "../../core/config/env.config";
import type {
  AcceptInvitationDto,
  CreateInvitationDto,
} from "./invitation.dto";

export const INVITATION_EXPIRY_DAYS = 7;

// Every invitation we hand back to a client goes through this. `tokenHash` is
// deliberately absent: it never leaves the server, in any response.
const INVITATION_SELECT = {
  id: true,
  email: true,
  organizationId: true,
  departmentId: true,
  designationId: true,
  officeBranchId: true,
  businessRole: true,
  status: true,
  invitedById: true,
  acceptedUserId: true,
  acceptedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export class InvitationService {
  // --- admin side ---

  async createInvitation(
    organizationId: string,
    invitedById: string,
    data: CreateInvitationDto,
  ) {
    const email = data.email.trim().toLowerCase();

    await this.assertInvitableEmail(organizationId, email);
    await this.assertContextInOrg(organizationId, data);

    const { invitation, token } = await this.issue(
      organizationId,
      invitedById,
      { ...data, email },
    );

    await this.sendInviteEmail(invitation.id, token);

    return invitation;
  }

  async checkEmail(organizationId: string, email: string) {
    await this.assertInvitableEmail(organizationId, email.trim().toLowerCase());
    return { success: true };
  }

  // Invites many at once, reporting per-email outcomes rather than failing the
  // whole batch — one duplicate address should not discard the other 20.
  async createInvitationsBulk(
    organizationId: string,
    invitedById: string,
    invitations: CreateInvitationDto[],
  ) {
    const results: Array<{
      email: string;
      status: "invited" | "failed";
      reason?: string;
    }> = [];

    // Guards against the same address appearing twice in one payload, which
    // would otherwise pass the duplicate check and send two live links.
    const seen = new Set<string>();

    for (const entry of invitations) {
      const email = entry.email.trim().toLowerCase();

      if (seen.has(email)) {
        results.push({
          email,
          status: "failed",
          reason: "Duplicate email in this request",
        });
        continue;
      }
      seen.add(email);

      try {
        await this.createInvitation(organizationId, invitedById, {
          ...entry,
          email,
        });
        results.push({ email, status: "invited" });
      } catch (err) {
        results.push({
          email,
          status: "failed",
          reason: (err as Error).message,
        });
      }
    }

    return results;
  }

  async listInvitations(
    organizationId: string,
    query: PaginationQuery & { status?: string },
  ) {
    const parsed = parseQuery(query);
    const where: Record<string, unknown> = { organizationId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.employeeInvitation.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { createdAt: "desc" },
        select: INVITATION_SELECT,
      }),
      prisma.employeeInvitation.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  async resendInvitation(id: string, organizationId: string) {
    const invitation = await prisma.employeeInvitation.findFirst({
      where: { id, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }
    if (invitation.status === "ACCEPTED") {
      throw new ConflictException("This invitation has already been accepted");
    }

    // Rotating the token invalidates whatever link was emailed before, so there
    // is only ever one live link per invitation.
    const token = crypto.randomBytes(32).toString("base64url");

    const updated = await prisma.employeeInvitation.update({
      where: { id },
      data: {
        tokenHash: hashToken(token),
        status: "PENDING",
        expiresAt: this.expiryDate(),
      },
      select: INVITATION_SELECT,
    });

    await this.sendInviteEmail(updated.id, token);

    return updated;
  }

  async revokeInvitation(id: string, organizationId: string) {
    const invitation = await prisma.employeeInvitation.findFirst({
      where: { id, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }
    if (invitation.status === "ACCEPTED") {
      throw new ConflictException(
        "This invitation has already been accepted and cannot be revoked",
      );
    }

    // Clearing tokenHash is what actually kills the emailed link; the status is
    // for the admin's benefit.
    return prisma.employeeInvitation.update({
      where: { id },
      data: { status: "REVOKED", tokenHash: null },
      select: INVITATION_SELECT,
    });
  }

  // --- public side ---

  // Resolves a raw token to a usable invitation, or explains why it is not.
  async verifyToken(token: string) {
    const invitation = await prisma.employeeInvitation.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        organization: { select: { name: true } },
      },
    });

    if (!invitation) {
      // Either the token is wrong, or it was consumed/revoked (both null the
      // hash). Look the address up by nothing — we have no email to go on — so
      // 410 is the most useful answer we can give without leaking anything.
      throw new GoneException(
        "This invitation link is no longer valid. It may have already been used or been revoked.",
      );
    }

    if (invitation.status !== "PENDING") {
      throw new GoneException("This invitation is no longer valid");
    }

    // Checked on every use, so an expired link fails even before the sweep has
    // marked it. The sweep is bookkeeping; this is the boundary.
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new GoneException(
        "This invitation has expired. Ask your administrator to send a new one.",
      );
    }

    return invitation;
  }

  async getInvitationPreview(token: string) {
    const invitation = await this.verifyToken(token);

    const [department, designation, officeBranch] = await Promise.all([
      invitation.departmentId
        ? prisma.department.findUnique({
            where: { id: invitation.departmentId },
            select: { name: true },
          })
        : null,
      invitation.designationId
        ? prisma.departmentDesignation.findUnique({
            where: { id: invitation.designationId },
            select: { name: true },
          })
        : null,
      invitation.officeBranchId
        ? prisma.officeBranch.findUnique({
            where: { id: invitation.officeBranchId },
            select: { name: true },
          })
        : null,
    ]);

    return {
      email: invitation.email,
      organizationName: invitation.organization.name,
      departmentName: department?.name ?? null,
      designationName: designation?.name ?? null,
      officeBranchName: officeBranch?.name ?? null,
      businessRole: invitation.businessRole,
      expiresAt: invitation.expiresAt,
    };
  }

  // Creates the account the invitation was standing in for. Everything happens
  // in one transaction so a failure cannot leave a user without an employee
  // record, or an invitation marked accepted with no account behind it.
  async acceptInvitation(data: AcceptInvitationDto) {
    const invitation = await this.verifyToken(data.token);

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (existingUser) {
      throw new ConflictException(
        "An account already exists for this email. Please log in instead.",
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return prisma.$transaction(async (tx) => {
      // Re-read inside the transaction and null the hash as part of the same
      // write, so two clicks on the same link cannot both create an account.
      const claimed = await tx.employeeInvitation.updateMany({
        where: { id: invitation.id, status: "PENDING", tokenHash: { not: null } },
        data: { status: "ACCEPTED", acceptedAt: new Date(), tokenHash: null },
      });
      if (claimed.count === 0) {
        throw new GoneException("This invitation has already been used");
      }

      const user = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: "EMPLOYEE",
          businessRole: invitation.businessRole,
          organizationId: invitation.organizationId,
          // Clicking a link sent to that address is the proof of ownership.
          isEmailVerified: true,
          isOnboarded: false,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          departmentId: invitation.departmentId,
          // A designation only means anything alongside its department.
          designationId: invitation.departmentId
            ? invitation.designationId
            : null,
          officeBranchId: invitation.officeBranchId,
        },
      });

      await tx.employeeProfile.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      });

      await tx.employeeInvitation.update({
        where: { id: invitation.id },
        data: { acceptedUserId: user.id },
      });

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, employee };
    });
  }

  // --- scheduler ---

  // Marks PENDING invitations whose expiry has passed. Purely so the admin's
  // list reads correctly; `verifyToken` already refuses them regardless.
  async expireStaleInvitations(): Promise<number> {
    const { count } = await prisma.employeeInvitation.updateMany({
      where: { status: "PENDING", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED", tokenHash: null },
    });
    return count;
  }

  // --- helpers ---

  private expiryDate(): Date {
    return new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  private async issue(
    organizationId: string,
    invitedById: string,
    data: CreateInvitationDto,
  ) {
    const token = crypto.randomBytes(32).toString("base64url");

    const invitation = await prisma.employeeInvitation.create({
      data: {
        email: data.email,
        tokenHash: hashToken(token),
        organizationId,
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        officeBranchId: data.officeBranchId ?? null,
        businessRole: data.businessRole ?? "REGULAR",
        invitedById,
        expiresAt: this.expiryDate(),
      },
      select: INVITATION_SELECT,
    });

    return { invitation, token };
  }

  private async sendInviteEmail(invitationId: string, token: string) {
    const invitation = await prisma.employeeInvitation.findUnique({
      where: { id: invitationId },
      include: { organization: { select: { name: true } } },
    });
    if (!invitation) return;

    const [department, designation] = await Promise.all([
      invitation.departmentId
        ? prisma.department.findUnique({
            where: { id: invitation.departmentId },
            select: { name: true },
          })
        : null,
      invitation.designationId
        ? prisma.departmentDesignation.findUnique({
            where: { id: invitation.designationId },
            select: { name: true },
          })
        : null,
    ]);

    const inviteUrl = `${envConfig.frontendUrl}/invite/accept?token=${encodeURIComponent(token)}`;

    const { subject, html } = employeeInviteEmail({
      organizationName: invitation.organization.name,
      inviteUrl,
      expiresInDays: INVITATION_EXPIRY_DAYS,
      departmentName: department?.name,
      designationName: designation?.name,
    });

    // Deliberately not awaited for its result: a bounced email must not undo a
    // valid invitation. The admin can resend.
    await sendMail({ to: invitation.email, subject, html });
  }

  private async assertInvitableEmail(organizationId: string, email: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException(
        existingUser.organizationId === organizationId
          ? "This person is already a member of your organization"
          : "An account already exists for this email",
      );
    }

    const pending = await prisma.employeeInvitation.findFirst({
      where: { organizationId, email, status: "PENDING" },
    });
    if (pending) {
      throw new ConflictException(
        "There is already a pending invitation for this email. Resend it instead.",
      );
    }
  }

  // Every id the admin attaches must belong to their own organization, or an
  // invitation could seat someone into another tenant's department.
  private async assertContextInOrg(
    organizationId: string,
    data: CreateInvitationDto,
  ) {
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, organizationId },
      });
      if (!department) {
        throw new NotFoundException("Department not found");
      }
    }

    if (data.designationId) {
      if (!data.departmentId) {
        throw new BadRequestException(
          "A designation can only be set together with its department",
        );
      }
      const designation = await prisma.departmentDesignation.findFirst({
        where: { id: data.designationId, departmentId: data.departmentId },
      });
      if (!designation) {
        throw new NotFoundException(
          "Designation not found in the selected department",
        );
      }
    }

    if (data.officeBranchId) {
      const branch = await prisma.officeBranch.findFirst({
        where: { id: data.officeBranchId, organizationId },
      });
      if (!branch) {
        throw new NotFoundException("Office branch not found");
      }
    }
  }
}
