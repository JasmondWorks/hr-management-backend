import { Router } from "express";
import { LeaveController } from "./leave.controller";
import { LeaveService } from "./leave.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createLeaveSchema,
  leaveIdParamSchema,
  getLeavesSchema,
} from "./leave.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorize,
  authorizeBusinessRole,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const leaveService = new LeaveService();
const leaveController = new LeaveController(leaveService);

router.use(authenticate);

// Employee requests leave / views their own requests.
router.post(
  "/",
  authorize("EMPLOYEE"),
  validate(createLeaveSchema),
  catchAsync(leaveController.request),
);

router.get(
  "/mine",
  authorize("EMPLOYEE"),
  validate(getLeavesSchema),
  catchAsync(leaveController.getMine),
);

// HR / org admin review and decide on leave requests.
router.get(
  "/",
  authorizeBusinessRole("HR"),
  validate(getLeavesSchema),
  catchAsync(leaveController.getForOrganization),
);

router.patch(
  "/:id/approve",
  authorizeBusinessRole("HR"),
  validate(leaveIdParamSchema),
  catchAsync(leaveController.approve),
);

router.patch(
  "/:id/reject",
  authorizeBusinessRole("HR"),
  validate(leaveIdParamSchema),
  catchAsync(leaveController.reject),
);

export { router as leaveRouter };
