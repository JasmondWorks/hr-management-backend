import { Router } from "express";
import { optionalAuthenticate } from "../core/middlewares/auth.middleware";
import { requireDepartmentForWrites } from "../core/middlewares/department.middleware";
import { authRouter } from "../modules/auth/auth.routes";
import { userRouter } from "../modules/user/user.routes";
import { organizationRouter } from "../modules/organization/organization.routes";
import { employeeRouter } from "../modules/employee/employee.routes";
import { applicationRouter } from "../modules/application/application.routes";
import { departmentRouter } from "../modules/department/department.routes";
import { officeBranchRouter } from "../modules/office-branch/office-branch.routes";
import { invitationRouter } from "../modules/invitation/invitation.routes";
import { meRouter } from "../modules/onboarding/onboarding.routes";
import { jobRouter } from "../modules/job/job.routes";
import { notificationRouter } from "../modules/notification/notification.routes";
import { attendanceRouter } from "../modules/attendance/attendance.routes";
import { payrollRouter } from "../modules/payroll/payroll.routes";
import { leaveRouter } from "../modules/leave/leave.routes";
import { holidayRouter } from "../modules/holiday/holiday.routes";
import { projectRouter } from "../modules/project/project.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { uploadRouter } from "../modules/upload/upload.routes";

const router = Router();

// Applied once here rather than per module. `optionalAuthenticate` only attaches
// req.user when a valid token is present — it never rejects, so public routes
// (job browsing, invitation accept) are unaffected, and each module still runs
// its own `authenticate` guard afterwards.
router.use(optionalAuthenticate, requireDepartmentForWrites);

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/organizations", organizationRouter);
router.use("/employees", employeeRouter);
router.use("/applications", applicationRouter);
router.use("/departments", departmentRouter);
router.use("/office-branches", officeBranchRouter);
router.use("/invitations", invitationRouter);
router.use("/me", meRouter);
router.use("/jobs", jobRouter);
router.use("/notifications", notificationRouter);
router.use("/attendance", attendanceRouter);
router.use("/payroll", payrollRouter);
router.use("/leaves", leaveRouter);
router.use("/holidays", holidayRouter);
router.use("/projects", projectRouter);
router.use("/dashboard", dashboardRouter);
router.use("/uploads", uploadRouter);

export { router };
