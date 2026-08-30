import { Router } from "express";
import { HolidayController } from "./holiday.controller";
import { HolidayService } from "./holiday.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createHolidaySchema,
  holidayIdParamSchema,
  getHolidaysSchema,
} from "./holiday.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  requireOrgAdmin,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const holidayService = new HolidayService();
const holidayController = new HolidayController(holidayService);

router.use(authenticate);

// Any org member can view the holiday calendar.
router.get(
  "/",
  validate(getHolidaysSchema),
  catchAsync(holidayController.getAll),
);

// Org admin manages holidays.
router.post(
  "/",
  requireOrgAdmin,
  validate(createHolidaySchema),
  catchAsync(holidayController.create),
);

router.delete(
  "/:id",
  requireOrgAdmin,
  validate(holidayIdParamSchema),
  catchAsync(holidayController.deleteOne),
);

export { router as holidayRouter };
