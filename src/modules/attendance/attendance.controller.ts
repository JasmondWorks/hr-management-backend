import { Request, Response } from "express";
import { AttendanceService } from "./attendance.service";
import { sendSuccess } from "../../core/utils/response.util";
import { BadRequestException } from "../../core/errors/app.error";

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  checkIn = async (req: Request, res: Response): Promise<void> => {
    const attendance = await this.attendanceService.checkIn(req.user!.userId);
    sendSuccess(res, 201, "Checked in", attendance);
  };

  checkOut = async (req: Request, res: Response): Promise<void> => {
    const attendance = await this.attendanceService.checkOut(req.user!.userId);
    sendSuccess(res, 200, "Checked out", attendance);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const { data, total, page, limit } =
      await this.attendanceService.listForEmployee(
        req.user!.userId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Attendance retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };

  getForOrganization = async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.user!;
    if (!organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    const { data, total, page, limit } =
      await this.attendanceService.listForOrganization(
        organizationId,
        req.query as Record<string, string>,
      );
    sendSuccess(res, 200, "Organization attendance retrieved", data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  };
}
