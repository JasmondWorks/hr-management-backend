import { Request, Response } from "express";
import { JobService } from "./job.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class JobController {
  constructor(private readonly jobService: JobService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const job = await this.jobService.createJob(organizationId, req.body);
    sendSuccess(res, 201, "Job created", job);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } = await this.jobService.listJobs(
      req.user,
      req.query as Record<string, string>,
      false
    );
    sendSuccess(res, 200, "Jobs retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } = await this.jobService.listJobs(
      req.user,
      req.query as Record<string, string>,
      true
    );
    sendSuccess(res, 200, "My jobs retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const job = await this.jobService.getJobById(
      req.params.id as string,
      req.user,
    );
    sendSuccess(res, 200, "Job retrieved", job);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const job = await this.jobService.updateJob(
      organizationId,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, 200, "Job updated", job);
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    await this.jobService.deleteJob(organizationId, req.params.id as string);
    sendSuccess(res, 200, "Job deleted");
  };
}
