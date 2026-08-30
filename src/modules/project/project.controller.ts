import { Request, Response } from "express";
import { ProjectService } from "./project.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.create(
      req.user!.userId,
      this.requireOrg(req),
      req.body,
    );
    sendSuccess(res, 201, "Project created", project);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } = await this.projectService.list(
      this.requireOrg(req),
      req.query as Record<string, string>,
    );
    sendSuccess(res, 200, "Projects retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.projectService.listForEmployee(
        req.user!.userId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Your projects retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.getById(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Project retrieved", project);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.update(
      req.params.id as string,
      this.requireOrg(req),
      req.body,
    );
    sendSuccess(res, 200, "Project updated", project);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.updateStatus(
      req.params.id as string,
      this.requireOrg(req),
      req.body.status,
    );
    sendSuccess(res, 200, "Project status updated", project);
  };

  addCollaborators = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.addCollaborators(
      req.params.id as string,
      this.requireOrg(req),
      req.body.employeeIds,
    );
    sendSuccess(res, 200, "Collaborators added", project);
  };

  removeCollaborator = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.removeCollaborator(
      req.params.id as string,
      this.requireOrg(req),
      req.params.employeeId as string,
    );
    sendSuccess(res, 200, "Collaborator removed", project);
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    await this.projectService.remove(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Project deleted");
  };
}
