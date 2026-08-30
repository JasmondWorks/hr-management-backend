import { Request, Response } from "express";
import { InvitationService } from "./invitation.service";
import { AuthService } from "../auth/auth.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly authService: AuthService,
  ) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const invitation = await this.invitationService.createInvitation(
      organizationId,
      req.user!.userId,
      req.body,
    );
    sendSuccess(res, 201, "Invitation sent", invitation);
  };

  createBulk = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const results = await this.invitationService.createInvitationsBulk(
      organizationId,
      req.user!.userId,
      req.body.invitations,
    );
    const invited = results.filter((r) => r.status === "invited").length;
    sendSuccess(
      res,
      201,
      `${invited} of ${results.length} invitation(s) sent`,
      results,
    );
  };

  check = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    await this.invitationService.checkEmail(organizationId, req.body.email);
    sendSuccess(res, 200, "Email is available for invitation", { success: true });
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const { data, total, page, limit } =
      await this.invitationService.listInvitations(
        organizationId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Invitations retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  resend = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const invitation = await this.invitationService.resendInvitation(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Invitation resent", invitation);
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    await this.invitationService.revokeInvitation(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Invitation revoked", null);
  };

  // --- public ---

  verify = async (req: Request, res: Response): Promise<void> => {
    const preview = await this.invitationService.getInvitationPreview(
      req.query.token as string,
    );
    sendSuccess(res, 200, "Invitation valid", preview);
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const { user } = await this.invitationService.acceptInvitation(req.body);

    // Log them straight in — the whole point of the link is that they arrive
    // without an account and leave with a session. Tokens are returned in the
    // body, exactly as POST /auth/login does; cookie storage is the frontend's.
    const session = await this.authService.login({
      email: user.email,
      password: req.body.password,
    });

    sendSuccess(res, 201, "Invitation accepted", {
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  };
}
