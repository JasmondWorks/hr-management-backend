import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { UnauthorizedException } from "../../core/errors/app.error";
import { sendSuccess } from "../../core/utils/response.util";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  registerOrganizationAdmin = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const user = await this.authService.registerWithRole(
      req.body,
      "EMPLOYEE",
      "ORGANIZATION_ADMIN",
    );
    sendSuccess(res, 201, "Organization admin registered successfully", user);
  };

  registerEmployee = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.registerWithRole(
      req.body,
      "EMPLOYEE",
      "REGULAR",
    );
    sendSuccess(res, 201, "Employee registered successfully", user);
  };

  registerCandidate = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.registerCandidate(req.body);
    sendSuccess(res, 201, "Candidate registered successfully", result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { user, accessToken, refreshToken } = await this.authService.login(
      req.body,
    );

    // Both tokens are returned in the body. Cookie storage of the refresh token
    // is owned entirely by the Next.js frontend (BFF route handlers).
    sendSuccess(res, 200, "Login successful", {
      user,
      accessToken,
      refreshToken,
    });
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, 200, "Logged out successfully");
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    // The refresh token arrives in the body (sent by the frontend from its
    // httpOnly cookie), not from a cookie the backend manages.
    const oldRefreshToken = req.body?.refreshToken;
    if (!oldRefreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(oldRefreshToken);

    sendSuccess(res, 200, "Tokens refreshed", { accessToken, refreshToken });
  };
}
