import { Request, Response } from "express";
import { OfficeBranchService } from "./office-branch.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class OfficeBranchController {
  constructor(private readonly officeBranchService: OfficeBranchService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const branch = await this.officeBranchService.createOfficeBranch(
      organizationId,
      req.body,
    );
    sendSuccess(res, 201, "Office branch created", branch);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const { data, total, page, limit } =
      await this.officeBranchService.listOfficeBranches(
        organizationId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Office branches retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const branch = await this.officeBranchService.getOfficeBranchById(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Office branch retrieved", branch);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const branch = await this.officeBranchService.updateOfficeBranch(
      req.params.id as string,
      organizationId,
      req.body,
    );
    sendSuccess(res, 200, "Office branch updated", branch);
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    await this.officeBranchService.deleteOfficeBranch(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Office branch deleted", null);
  };
}
