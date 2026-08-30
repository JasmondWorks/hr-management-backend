import { Router } from "express";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  generatePayrollSchema,
  payrollIdParamSchema,
  getPayrollsSchema,
} from "./payroll.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorize,
  authorizeBusinessRole,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const payrollService = new PayrollService();
const payrollController = new PayrollController(payrollService);

router.use(authenticate);

// Employee views their own payslips.
router.get(
  "/mine",
  authorize("EMPLOYEE"),
  validate(getPayrollsSchema),
  catchAsync(payrollController.getMine),
);

// HR / org admin manage payroll.
router.post(
  "/generate",
  authorizeBusinessRole("HR"),
  validate(generatePayrollSchema),
  catchAsync(payrollController.generate),
);

router.get(
  "/",
  authorizeBusinessRole("HR"),
  validate(getPayrollsSchema),
  catchAsync(payrollController.getForOrganization),
);

router.patch(
  "/:id/pay",
  authorizeBusinessRole("HR"),
  validate(payrollIdParamSchema),
  catchAsync(payrollController.markPaid),
);

export { router as payrollRouter };
