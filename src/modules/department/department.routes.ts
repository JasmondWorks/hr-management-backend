import { Router } from "express";
import { DepartmentController } from "./department.controller";
import { DepartmentService } from "./department.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createDepartmentSchema,
  getDepartmentsSchema,
} from "./department.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorizeBusinessRole,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const departmentService = new DepartmentService();
const departmentController = new DepartmentController(departmentService);

router.use(authenticate);

// Department admin creates a department in their organization
router.post(
  "/",
  authorizeBusinessRole("DEPARTMENT_ADMIN"),
  validate(createDepartmentSchema),
  catchAsync(departmentController.create),
);

router.get(
  "/",
  validate(getDepartmentsSchema),
  catchAsync(departmentController.getAll),
);

router.get(
  "/:id",
  catchAsync(departmentController.getById),
);

export { router as departmentRouter };
