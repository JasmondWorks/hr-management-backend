import { Request, Response } from "express";
import { OrganizationService } from "./organization.service";
import { sendSuccess } from "../../core/utils/response.util";
import { parseQuery } from "../../core/dto/query.dto";
import { BadRequestException } from "../../core/errors/app.error";

export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const org = await this.organizationService.createOrganization(
      req.body,
      req.user!.userId,
    );
    sendSuccess(res, 201, "Organization created", org);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const org = await this.organizationService.getMyOrganization(req.user!.userId);
    sendSuccess(res, 200, "Organization retrieved", org);
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.organizationService.getOrganizationUsers(
        req.user!.userId,
        req.query as Record<string, string>,
      );

    sendSuccess(res, 200, "Organization users retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  addUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.organizationService.addUserToOrganization(
      req.user!.userId,
      req.body.userId,
    );
    sendSuccess(res, 200, "User added to organization", user);
  };

  removeUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.organizationService.removeUserFromOrganization(
      req.user!.userId,
      req.params.userId as string,
    );
    sendSuccess(res, 200, "User removed from organization", user);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const parsed = parseQuery(req.query as Record<string, string>);
    const { data, total } = await this.organizationService.getAllOrganizations(
      req.query as Record<string, string>,
    );

    sendSuccess(res, 200, "Organizations retrieved", data, {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const org = await this.organizationService.getOrganizationById(
      req.params.id as string,
    );
    sendSuccess(res, 200, "Organization retrieved", org);
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    await this.organizationService.deleteOrganization(req.params.id as string);
    sendSuccess(res, 200, "Organization deleted");
  };

  updateMine = async (req: Request, res: Response): Promise<void> => {
    const org = await this.organizationService.updateOrganization(
      this.requireOrg(req),
      req.body,
    );
    sendSuccess(res, 200, "Organization updated", org);
  };
}
