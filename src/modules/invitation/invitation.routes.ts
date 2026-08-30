import { Router } from "express";
import { InvitationController } from "./invitation.controller";
import { InvitationService } from "./invitation.service";
import { AuthService } from "../auth/auth.service";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createInvitationSchema,
  bulkCreateInvitationSchema,
  checkInvitationSchema,
  getInvitationsSchema,
  invitationIdSchema,
  verifyInvitationSchema,
  acceptInvitationSchema,
} from "./invitation.dto";
import { catchAsync } from "../../core/utils/catch-async";
import {
  authenticate,
  requireOrgAdmin,
} from "../../core/middlewares/auth.middleware";

const router = Router();
const invitationService = new InvitationService();
const invitationController = new InvitationController(
  invitationService,
  new AuthService(),
);

// --- public routes ---
// These run before the invitee has an account, so they cannot be authenticated.
// They are mounted ahead of the `authenticate` guard below.

router.get(
  "/verify",
  validate(verifyInvitationSchema),
  catchAsync(invitationController.verify),
);

router.post(
  "/accept",
  validate(acceptInvitationSchema),
  catchAsync(invitationController.accept),
);

// --- admin routes ---

router.use(authenticate);

router.post(
  "/",
  requireOrgAdmin,
  validate(createInvitationSchema),
  catchAsync(invitationController.create),
);

router.post(
  "/bulk",
  requireOrgAdmin,
  validate(bulkCreateInvitationSchema),
  catchAsync(invitationController.createBulk),
);

router.post(
  "/check",
  requireOrgAdmin,
  validate(checkInvitationSchema),
  catchAsync(invitationController.check),
);

router.get(
  "/",
  requireOrgAdmin,
  validate(getInvitationsSchema),
  catchAsync(invitationController.getAll),
);

router.post(
  "/:id/resend",
  requireOrgAdmin,
  validate(invitationIdSchema),
  catchAsync(invitationController.resend),
);

router.delete(
  "/:id",
  requireOrgAdmin,
  validate(invitationIdSchema),
  catchAsync(invitationController.revoke),
);

export { router as invitationRouter };
