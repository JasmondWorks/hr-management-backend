import { Request, Response } from "express";
import { HolidayService } from "./holiday.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  private requireOrg(req: Request): string {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    return organizationId;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const holiday = await this.holidayService.create(
      this.requireOrg(req),
      req.body,
    );
    sendSuccess(res, 201, "Holiday created", holiday);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } = await this.holidayService.list(
      this.requireOrg(req),
      req.query as Record<string, string>,
    );
    sendSuccess(res, 200, "Holidays retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  deleteOne = async (req: Request, res: Response): Promise<void> => {
    await this.holidayService.remove(req.params.id as string, this.requireOrg(req));
    sendSuccess(res, 200, "Holiday deleted");
  };
}
