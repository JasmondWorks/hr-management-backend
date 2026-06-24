import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { validate } from "../../core/middlewares/validate.middleware";
import { getUsersSchema, getUserByIdSchema } from "./user.dto";
import { catchAsync } from "../../core/utils/catch-async";
import { authenticate } from "../../core/middlewares/auth.middleware";

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Apply auth middleware to all user routes
router.use(authenticate);

router.get(
  "/",
  validate(getUsersSchema),
  catchAsync(userController.getAll),
);

router.get(
  "/:id",
  validate(getUserByIdSchema),
  catchAsync(userController.getById),
);

router.delete(
  "/:id",
  validate(getUserByIdSchema),
  catchAsync(userController.deleteOne),
);

export { router as userRouter };
