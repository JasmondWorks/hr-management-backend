import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { envConfig } from "../../core/config/env.config";
import { UnauthorizedException } from "../../core/errors/app.error";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieOptions(maxAgeMs: number) {
    return {
      httpOnly: true,
      secure: envConfig.nodeEnv === "production",
      sameSite: "strict" as const,
      maxAge: maxAgeMs,
      path: "/",
    };
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.register(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { user, accessToken, refreshToken } = await this.authService.login(req.body);

    const accessMaxAge = this.parseExpiry(envConfig.jwt.accessExpiresIn as string);
    const refreshMaxAge = this.parseExpiry(envConfig.jwt.refreshExpiresIn as string);

    res.cookie(ACCESS_COOKIE, accessToken, this.cookieOptions(accessMaxAge));
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions(refreshMaxAge));

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!oldRefreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const { accessToken, refreshToken } = this.authService.refreshTokens(oldRefreshToken);

    const accessMaxAge = this.parseExpiry(envConfig.jwt.accessExpiresIn as string);
    const refreshMaxAge = this.parseExpiry(envConfig.jwt.refreshExpiresIn as string);

    res.cookie(ACCESS_COOKIE, accessToken, this.cookieOptions(accessMaxAge));
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions(refreshMaxAge));

    res.status(200).json({
      success: true,
      message: "Tokens refreshed",
    });
  };
}
