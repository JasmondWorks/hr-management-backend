import { Request, Response } from "express";
import { ApplicationService } from "./application.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  apply = async (req: Request, res: Response): Promise<void> => {
    const application = await this.applicationService.apply(
      req.user!.userId,
      req.body.jobId,
    );
    sendSuccess(res, 201, "Application submitted", application);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const result = await this.applicationService.listForCandidate(
      req.user!.userId,
      req.query as Record<string, string>,
    );

    sendSuccess(res, 200, "Your applications retrieved", result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  };

  getForMyOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }

    const { data, total, page, limit } =
      await this.applicationService.listForOrganization(
        organizationId,
        req.query as Record<string, string>,
      );

    sendSuccess(res, 200, "Applications retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }

    const result = await this.applicationService.accept(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Application accepted; candidate promoted to employee", result);
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }

    const application = await this.applicationService.reject(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Application rejected", application);
  };
}
