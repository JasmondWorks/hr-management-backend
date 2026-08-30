import { Request, Response } from "express";
import { OnboardingService } from "./onboarding.service";
import { sendSuccess } from "../../core/utils/response.util";

export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  getContext = async (req: Request, res: Response): Promise<void> => {
    const context = await this.onboardingService.getContext(req.user!.userId);
    sendSuccess(res, 200, "Onboarding context retrieved", context);
  };

  markComplete = async (req: Request, res: Response): Promise<void> => {
    const context = await this.onboardingService.markComplete(req.user!.userId);
    sendSuccess(res, 200, "Onboarding completed", context);
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const context = await this.onboardingService.complete(
      req.user!.userId,
      req.body,
    );
    sendSuccess(res, 200, "Onboarding completed", context);
  };
}
