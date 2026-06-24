import { Router } from "express";
import { createRoute } from "../../core/framework";
import { envConfig } from "../../core/config/env.config";
import { UnauthorizedException } from "../../core/errors/app.error";
import { AuthService } from "./auth.service";
import {
  registerContract,
  loginContract,
  logoutContract,
  refreshContract,
} from "./auth.contracts";

const router = Router();
const authService = new AuthService();

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: envConfig.nodeEnv === "production",
    sameSite: "strict" as const,
    maxAge: maxAgeMs,
    path: "/",
  };
}

function parseExpiry(expiry: string): number {
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

// ── Routes ───────────────────────────────────────────────────────────────────

router.post(
  "/register",
  ...createRoute(registerContract, async ({ body }) => {
    const user = await authService.register(body);
    return { status: 201, data: user, message: "User registered successfully" };
  }),
);

router.post(
  "/login",
  ...createRoute(loginContract, async ({ body, res }) => {
    const { user, accessToken, refreshToken } = await authService.login(body);

    const accessMaxAge = parseExpiry(envConfig.jwt.accessExpiresIn as string);
    const refreshMaxAge = parseExpiry(envConfig.jwt.refreshExpiresIn as string);

    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(accessMaxAge));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshMaxAge));

    return { status: 200, data: user, message: "Login successful" };
  }),
);

router.post(
  "/logout",
  ...createRoute(logoutContract, async ({ res }) => {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
    return { status: 200, message: "Logged out successfully" };
  }),
);

router.post(
  "/refresh",
  ...createRoute(refreshContract, async ({ req, res }) => {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!oldRefreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const { accessToken, refreshToken } = authService.refreshTokens(oldRefreshToken);

    const accessMaxAge = parseExpiry(envConfig.jwt.accessExpiresIn as string);
    const refreshMaxAge = parseExpiry(envConfig.jwt.refreshExpiresIn as string);

    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(accessMaxAge));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshMaxAge));

    return { status: 200, message: "Tokens refreshed" };
  }),
);

export { router as authRouter };
