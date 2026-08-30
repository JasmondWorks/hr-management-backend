import { Router } from "express";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createApplicationSchema,
  applicationIdParamSchema,
  getApplicationsSchema,
} from "./application.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorize,
  requireOrgAdmin,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const applicationService = new ApplicationService();
const applicationController = new ApplicationController(applicationService);

router.use(authenticate);

// Candidate applies to a job
router.post(
  "/",
  authorize("CANDIDATE"),
  validate(createApplicationSchema),
  catchAsync(applicationController.apply),
);

// Candidate views their own applications
router.get(
  "/mine",
  authorize("CANDIDATE"),
  validate(getApplicationsSchema),
  catchAsync(applicationController.getMine),
);

// Organization admin reviews applications to their org's jobs
router.get(
  "/",
  requireOrgAdmin,
  validate(getApplicationsSchema),
  catchAsync(applicationController.getForMyOrganization),
);

// Organization admin accepts an application (promotes candidate to employee)
router.post(
  "/:id/accept",
  requireOrgAdmin,
  validate(applicationIdParamSchema),
  catchAsync(applicationController.accept),
);

// Organization admin rejects an application
router.post(
  "/:id/reject",
  requireOrgAdmin,
  validate(applicationIdParamSchema),
  catchAsync(applicationController.reject),
);

export { router as applicationRouter };
