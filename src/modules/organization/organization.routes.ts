import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { OrganizationRepository } from "./organization.repository";
import { validate } from "../../core/middlewares/validate.middleware";
import { getOrganizationsSchema, getOrganizationByIdSchema, createOrganizationSchema, addUserToOrgSchema, updateOrganizationSchema } from "./organization.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  authorize,
  requireOrgAdmin,
  requireOrgAdminRole,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const organizationRepository = new OrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);
const organizationController = new OrganizationController(organizationService);

router.use(authenticate);

router.get(
  "/mine",
  catchAsync(organizationController.getMine),
);

router.patch(
  "/mine",
  requireOrgAdmin,
  validate(updateOrganizationSchema),
  catchAsync(organizationController.updateMine),
);

router.get(
  "/users",
  requireOrgAdmin,
  validate(getOrganizationsSchema),
  catchAsync(organizationController.getUsers),
);

router.post(
  "/users",
  requireOrgAdmin,
  validate(addUserToOrgSchema),
  catchAsync(organizationController.addUser),
);

router.delete(
  "/users/:userId",
  requireOrgAdmin,
  catchAsync(organizationController.removeUser),
);

// Onboarding: the caller is an org admin who does not have an organization yet,
// so this is the one route that uses the role-only guard.
router.post(
  "/",
  requireOrgAdminRole,
  validate(createOrganizationSchema),
  catchAsync(organizationController.create),
);

// The routes below operate across tenants (list every organization, read or
// delete one by id), so they are platform-staff only — RoleType.ADMIN, which no
// self-service registration path can grant. Organization admins read their own
// organization through GET /organizations/mine instead.
router.get(
  "/",
  authorize("ADMIN"),
  validate(getOrganizationsSchema),
  catchAsync(organizationController.getAll),
);

router.get(
  "/:id",
  authorize("ADMIN"),
  validate(getOrganizationByIdSchema),
  catchAsync(organizationController.getById),
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  validate(getOrganizationByIdSchema),
  catchAsync(organizationController.deleteOne),
);

export { router as organizationRouter };
