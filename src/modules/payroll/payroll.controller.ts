import { Request, Response } from "express";
import { PayrollService } from "./payroll.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  generate = async (req: Request, res: Response): Promise<void> => {
    const result = await this.payrollService.generate(
      this.requireOrg(req),
      req.body,
    );
    sendSuccess(res, 201, "Payroll generated", result);
  };

  markPaid = async (req: Request, res: Response): Promise<void> => {
    const payroll = await this.payrollService.markPaid(
      req.params.id as string,
      this.requireOrg(req),
    );
    sendSuccess(res, 200, "Payroll marked as paid", payroll);
  };

  getForOrganization = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.payrollService.listForOrganization(
        this.requireOrg(req),
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Payroll retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.payrollService.listForEmployee(
        req.user!.userId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Your payroll retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };
}
