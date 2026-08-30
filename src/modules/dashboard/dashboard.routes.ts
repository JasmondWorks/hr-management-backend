import { Request, Response, Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { BusinessRole, RoleType } from "../../generated/prisma/enums";
import { authenticate, authorize, authorizeBusinessRole } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../core/utils/catch-async";

const dashboardRouter = Router();
const controller = new DashboardController();

dashboardRouter.get(
  "/admin",
  authenticate,
  authorize(RoleType.ADMIN, RoleType.EMPLOYEE),
  authorizeBusinessRole(BusinessRole.ORGANIZATION_ADMIN, BusinessRole.HR, BusinessRole.DEPARTMENT_ADMIN),
  catchAsync(controller.getAdminStats)
);

dashboardRouter.get(
  "/candidate",
  authenticate,
  authorize(RoleType.CANDIDATE),
  catchAsync(controller.getCandidateStats)
);

export { dashboardRouter };
