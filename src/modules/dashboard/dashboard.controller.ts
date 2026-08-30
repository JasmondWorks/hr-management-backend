import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { sendSuccess } from "../../core/utils/response.util";
import { UnauthorizedException } from "../../core/errors/app.error";

export class DashboardController {
  private dashboardService = new DashboardService();

  getAdminStats = async (req: Request, res: Response) => {
    // Requires authenticated admin
    const user = req.user;
    if (!user) throw new UnauthorizedException("User not found");
    if (!user.organizationId) throw new UnauthorizedException("User is not part of an organization");

    const data = await this.dashboardService.getAdminStats(user.organizationId);

    return sendSuccess(res, 200, "Dashboard stats retrieved successfully", data);
  };

  getCandidateStats = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new UnauthorizedException("User not found");

    const data = await this.dashboardService.getCandidateStats(user.userId);

    return sendSuccess(res, 200, "Candidate dashboard stats retrieved successfully", data);
  };
}
