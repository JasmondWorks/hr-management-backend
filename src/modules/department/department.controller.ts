import { Request, Response } from "express";
import { DepartmentService } from "./department.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const department = await this.departmentService.createDepartment(
      organizationId,
      req.body,
    );
    sendSuccess(res, 201, "Department created", department);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const { data, total, page, limit } =
      await this.departmentService.listDepartments(
        organizationId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Departments retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };
  getById = async (req: Request, res: Response): Promise<void> => {
    const organizationId = this.requireOrg(req);
    const department = await this.departmentService.getDepartmentById(
      req.params.id as string,
      organizationId,
    );
    sendSuccess(res, 200, "Department retrieved", department);
  };
}
