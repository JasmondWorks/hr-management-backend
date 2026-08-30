import { Request, Response } from "express";
import { LeaveService } from "./leave.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  request = async (req: Request, res: Response): Promise<void> => {
    const leave = await this.leaveService.request(req.user!.userId, req.body);
    sendSuccess(res, 201, "Leave requested", leave);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.leaveService.listForEmployee(
        req.user!.userId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Leave requests retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getForOrganization = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.leaveService.listForOrganization(
        this.requireOrg(req),
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Leave requests retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    const leave = await this.leaveService.approve(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Leave approved", leave);
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    const leave = await this.leaveService.reject(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Leave rejected", leave);
  };
}
