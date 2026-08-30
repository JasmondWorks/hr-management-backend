import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { validate } from "../../core/middlewares/validate.middleware";
import { getUsersSchema, getUserByIdSchema } from "./user.dto";
import { catchAsync } from "../../core/utils/catch-async";
import { authenticate, requireOrgAdmin } from "../../core/middlewares/auth.middleware";

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.use(authenticate);

router.get(
  "/",
  requireOrgAdmin,
  validate(getUsersSchema),
  catchAsync(userController.getAll),
);

// No requireOrgAdmin: every signed-in user reads their own record here (the
// auth provider does this on every page load). The service still refuses reads
// of anyone outside the caller's organization.
router.get(
  "/:id",
  validate(getUserByIdSchema),
  catchAsync(userController.getById),
);

router.delete(
  "/:id",
  requireOrgAdmin,
  validate(getUserByIdSchema),
  catchAsync(userController.deleteOne),
);

export { router as userRouter };
