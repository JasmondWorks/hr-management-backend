import { Router } from "express";
import { OfficeBranchController } from "./office-branch.controller";
import { OfficeBranchService } from "./office-branch.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createOfficeBranchSchema,
  getOfficeBranchesSchema,
  officeBranchIdSchema,
  updateOfficeBranchSchema,
} from "./office-branch.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  requireOrgAdmin,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const officeBranchService = new OfficeBranchService();
const officeBranchController = new OfficeBranchController(officeBranchService);

router.use(authenticate);

// Reads are open to any member of the organization — the job form needs the
// branch list, and it is not an admin-only screen.
router.get(
  "/",
  validate(getOfficeBranchesSchema),
  catchAsync(officeBranchController.getAll),
);

router.get(
  "/:id",
  validate(officeBranchIdSchema),
  catchAsync(officeBranchController.getById),
);

// Writes are organization-admin only.
router.post(
  "/",
  requireOrgAdmin,
  validate(createOfficeBranchSchema),
  catchAsync(officeBranchController.create),
);

router.patch(
  "/:id",
  requireOrgAdmin,
  validate(updateOfficeBranchSchema),
  catchAsync(officeBranchController.update),
);

router.delete(
  "/:id",
  requireOrgAdmin,
  validate(officeBranchIdSchema),
  catchAsync(officeBranchController.deleteOne),
);

export { router as officeBranchRouter };
