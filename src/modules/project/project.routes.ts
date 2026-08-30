import { Router } from "express";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  addCollaboratorsSchema,
  removeCollaboratorSchema,
  projectIdParamSchema,
  getProjectsSchema,
} from "./project.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorize,
  authorizeBusinessRole,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const projectService = new ProjectService();
const projectController = new ProjectController(projectService);

// Admins only (department admin / HR; org admins auto-pass). Not regular staff.
const adminOnly = authorizeBusinessRole("DEPARTMENT_ADMIN", "HR");

router.use(authenticate);

// A collaborator's own projects (registered before "/:id").
router.get(
  "/mine",
  authorize("EMPLOYEE"),
  validate(getProjectsSchema),
  catchAsync(projectController.getMine),
);

// Any org member can view projects.
router.get(
  "/",
  validate(getProjectsSchema),
  catchAsync(projectController.getAll),
);

router.get(
  "/:id",
  validate(projectIdParamSchema),
  catchAsync(projectController.getById),
);

// Admin-only management.
router.post(
  "/",
  adminOnly,
  validate(createProjectSchema),
  catchAsync(projectController.create),
);

router.patch(
  "/:id",
  adminOnly,
  validate(updateProjectSchema),
  catchAsync(projectController.update),
);

router.patch(
  "/:id/status",
  adminOnly,
  validate(updateProjectStatusSchema),
  catchAsync(projectController.updateStatus),
);

router.post(
  "/:id/collaborators",
  adminOnly,
  validate(addCollaboratorsSchema),
  catchAsync(projectController.addCollaborators),
);

router.delete(
  "/:id/collaborators/:employeeId",
  adminOnly,
  validate(removeCollaboratorSchema),
  catchAsync(projectController.removeCollaborator),
);

router.delete(
  "/:id",
  adminOnly,
  validate(projectIdParamSchema),
  catchAsync(projectController.deleteOne),
);

export { router as projectRouter };
