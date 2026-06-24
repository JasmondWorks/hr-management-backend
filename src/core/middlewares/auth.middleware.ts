import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config";
import { UnauthorizedException } from "../errors/app.error";

export interface AuthPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.access_token;
  if (!token) {
    return next(new UnauthorizedException("Access token missing"));
  }

  try {
    const payload = jwt.verify(
      token,
      envConfig.jwt.accessSecret as string,
    ) as jwt.JwtPayload;

    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedException("Invalid or expired access token"));
  }
};
