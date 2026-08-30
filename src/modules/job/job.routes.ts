import { Router } from "express";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createJobSchema,
  updateJobSchema,
  getJobsSchema,
  jobIdParamSchema,
} from "./job.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorizeBusinessRole,
  optionalAuthenticate,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const jobService = new JobService();
const jobController = new JobController(jobService);

// Browse jobs (public): org members see their org's jobs, everyone else
// (candidates / anonymous) browses OPEN jobs across organizations.
router.get(
  "/",
  optionalAuthenticate,
  validate(getJobsSchema),
  catchAsync(jobController.getAll),
);

router.get(
  "/mine",
  authenticate,
  validate(getJobsSchema),
  catchAsync(jobController.getMine),
);

router.get(
  "/:id",
  optionalAuthenticate,
  validate(jobIdParamSchema),
  catchAsync(jobController.getById),
);

// Department admin manages jobs (organization admins pass automatically).
router.post(
  "/",
  authenticate,
  authorizeBusinessRole("DEPARTMENT_ADMIN"),
  validate(createJobSchema),
  catchAsync(jobController.create),
);

router.patch(
  "/:id",
  authenticate,
  authorizeBusinessRole("DEPARTMENT_ADMIN"),
  validate(updateJobSchema),
  catchAsync(jobController.update),
);

router.delete(
  "/:id",
  authenticate,
  authorizeBusinessRole("DEPARTMENT_ADMIN"),
  validate(jobIdParamSchema),
  catchAsync(jobController.deleteOne),
);

export { router as jobRouter };
