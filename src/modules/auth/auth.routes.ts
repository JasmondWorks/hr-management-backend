import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { validate } from "../../core/middlewares/validate.middleware";
import { loginSchema, registerSchema } from "./auth.dto";
import { catchAsync } from "../../core/utils/catch-async";

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post(
  "/register/organization-admin",
  validate(registerSchema),
  catchAsync(authController.registerOrganizationAdmin),
);

router.post(
  "/register/employee",
  validate(registerSchema),
  catchAsync(authController.registerEmployee),
);

router.post(
  "/register/candidate",
  validate(registerSchema),
  catchAsync(authController.registerCandidate),
);

router.post(
  "/login",
  validate(loginSchema),
  catchAsync(authController.login),
);

router.post(
  "/logout",
  catchAsync(authController.logout),
);

router.post(
  "/refresh",
  catchAsync(authController.refresh),
);

export { router as authRouter };
