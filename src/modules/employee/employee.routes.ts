import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { EmployeeService } from "./employee.service";
import { EmployeeRepository } from "./employee.repository";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  getEmployeesSchema,
  getEmployeeByIdSchema,
  assignDepartmentSchema,
  setSalarySchema,
  updateBusinessRoleSchema,
} from "./employee.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  requireOrgAdmin,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const employeeRepository = new EmployeeRepository();
const employeeService = new EmployeeService(employeeRepository);
const employeeController = new EmployeeController(employeeService);

router.use(authenticate);

router.get(
  "/",
  requireOrgAdmin,
  validate(getEmployeesSchema),
  catchAsync(employeeController.getAll),
);

router.get(
  "/:id",
  requireOrgAdmin,
  validate(getEmployeeByIdSchema),
  catchAsync(employeeController.getById),
);

router.patch(
  "/:id/department",
  requireOrgAdmin,
  validate(assignDepartmentSchema),
  catchAsync(employeeController.assignDepartment),
);

router.patch(
  "/:id/salary",
  requireOrgAdmin,
  validate(setSalarySchema),
  catchAsync(employeeController.setSalary),
);

router.patch(
  "/:id/business-role",
  requireOrgAdmin,
  validate(updateBusinessRoleSchema),
  catchAsync(employeeController.updateBusinessRole),
);

router.delete(
  "/:id",
  requireOrgAdmin,
  validate(getEmployeeByIdSchema),
  catchAsync(employeeController.deleteOne),
);

export { router as employeeRouter };
