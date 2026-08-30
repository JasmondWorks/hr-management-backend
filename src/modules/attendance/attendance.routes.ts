import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";
import { validate } from "../../core/middlewares/validate.middleware";
import { getAttendancesSchema } from "./attendance.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorize,
  requireOrgAdmin,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const attendanceService = new AttendanceService();
const attendanceController = new AttendanceController(attendanceService);

router.use(authenticate);

// Employee marks their own daily attendance (once per day).
router.post(
  "/check-in",
  authorize("EMPLOYEE"),
  catchAsync(attendanceController.checkIn),
);

router.post(
  "/check-out",
  authorize("EMPLOYEE"),
  catchAsync(attendanceController.checkOut),
);

router.get(
  "/mine",
  authorize("EMPLOYEE"),
  validate(getAttendancesSchema),
  catchAsync(attendanceController.getMine),
);

// Organization admin views the whole org's attendance.
router.get(
  "/",
  requireOrgAdmin,
  validate(getAttendancesSchema),
  catchAsync(attendanceController.getForOrganization),
);

export { router as attendanceRouter };
