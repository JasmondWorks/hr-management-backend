import { Router } from "express";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { validate } from "../../core/middlewares/validate.middleware";
import { completeOnboardingSchema } from "./onboarding.dto";
import { catchAsync } from "../../core/utils/catch-async";
import { authenticate } from "../../core/middlewares/auth.middleware";

const router = Router();
const onboardingService = new OnboardingService();
const onboardingController = new OnboardingController(onboardingService);

router.use(authenticate);

// Any signed-in user reads and completes their own onboarding — the user id
// comes from the token, so there is nothing to authorize beyond being logged in.
router.get("/onboarding", catchAsync(onboardingController.getContext));

router.patch(
  "/onboarding",
  validate(completeOnboardingSchema),
  catchAsync(onboardingController.complete),
);

// Finishes the organization-admin wizard, which has no personal-details form of
// its own — the flag is what stops a page refresh dumping them on the dashboard
// with the branch and invitation steps never seen.
router.post(
  "/onboarding/complete",
  catchAsync(onboardingController.markComplete),
);

export { router as meRouter };
