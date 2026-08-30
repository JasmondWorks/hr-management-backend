import { Request, Response } from "express";
import { EmployeeService } from "./employee.service";
import { sendSuccess } from "../../core/utils/response.util";
import { parseQuery } from "../../core/dto/query.dto";
import { BadRequestException } from "../../core/errors/app.error";

export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.user!;
    
    if (!organizationId) {
      sendSuccess(res, 200, "Employees retrieved", [], {
        page: 1, limit: 10, total: 0, totalPages: 0
      });
      return;
    }

    const parsed = parseQuery(req.query as Record<string, string>);
    const { data, total } = await this.employeeService.getAllEmployees(
      req.query as Record<string, string>,
      organizationId
    );

    sendSuccess(res, 200, "Employees retrieved", data, {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const employee = await this.employeeService.getEmployeeById(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Employee retrieved", employee);
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    await this.employeeService.deleteEmployee(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Employee deleted");
  };

  assignDepartment = async (req: Request, res: Response): Promise<void> => {
    const employee = await this.employeeService.assignDepartment(
      req.params.id as string,
      this.requireOrg(req),
      req.body,
    );
    sendSuccess(res, 200, "Employee department updated", employee);
  };

  setSalary = async (req: Request, res: Response): Promise<void> => {
    const employee = await this.employeeService.setSalary(
      req.params.id as string,
      this.requireOrg(req),
      req.body.salary,
    );
    sendSuccess(res, 200, "Employee salary updated", employee);
  };

  updateBusinessRole = async (req: Request, res: Response): Promise<void> => {
    const employee = await this.employeeService.updateBusinessRole(
      req.params.id as string,
      this.requireOrg(req),
      req.body.businessRole,
    );
    sendSuccess(res, 200, "Employee business role updated", employee);
  };
}
