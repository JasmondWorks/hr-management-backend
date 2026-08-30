import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config";
import { UnauthorizedException, ForbiddenException } from "../errors/app.error";
import type { RoleType, BusinessRole } from "../../generated/prisma/client";

export interface AuthPayload {
  userId: string;
  email: string;
  role: RoleType;
  businessRole: BusinessRole | null;
  organizationId: string | null;
  isOnboarded: boolean;
  departmentId: string | null;
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
  // Access token is sent via the Authorization header (the frontend keeps it in
  // memory, not in a cookie). Fall back to the cookie for backwards-compat.
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const token = bearer ?? req.cookies?.access_token;
  if (!token) {
    return next(new UnauthorizedException("Access token missing"));
  }

  try {
    const payload = jwt.verify(
      token,
      envConfig.jwt.accessSecret as string,
    ) as jwt.JwtPayload;

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      businessRole: payload.businessRole ?? null,
      organizationId: payload.organizationId ?? null,
      isOnboarded: payload.isOnboarded ?? false,
      departmentId: payload.departmentId ?? null,
    };
    next();
  } catch {
    next(new UnauthorizedException("Invalid or expired access token"));
  }
};

// Like `authenticate`, but never rejects: attaches req.user when a valid token
// is present, otherwise continues anonymously. For routes that are public but
// behave differently when signed in (e.g. browsing jobs).
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const token = bearer ?? req.cookies?.access_token;
  if (!token) return next();

  try {
    const payload = jwt.verify(
      token,
      envConfig.jwt.accessSecret as string,
    ) as jwt.JwtPayload;
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      businessRole: payload.businessRole ?? null,
      organizationId: payload.organizationId ?? null,
      isOnboarded: payload.isOnboarded ?? false,
      departmentId: payload.departmentId ?? null,
    };
  } catch {
    // Ignore invalid token for optional auth.
  }
  next();
};

export const authorize = (...allowedRoles: RoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException("Access token missing"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenException());
    }

    next();
  };
};

/**
 * Guards by the user's functional role within their organization (businessRole).
 * ORGANIZATION_ADMIN always passes — they outrank functional roles in their org.
 * Use after `authenticate`, e.g. authorizeBusinessRole("DEPARTMENT_ADMIN").
 */
export const authorizeBusinessRole = (...allowed: BusinessRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException("Access token missing"));
    }

    if (req.user.businessRole === "ORGANIZATION_ADMIN") {
      return next();
    }

    if (!req.user.businessRole || !allowed.includes(req.user.businessRole)) {
      return next(new ForbiddenException());
    }

    next();
  };
};

/**
 * Guards a route to organization admins only (businessRole ORGANIZATION_ADMIN),
 * and additionally requires that they actually belong to an organization.
 *
 * The organization check matters for tenant isolation: /auth/register/organization-admin
 * is public, so anyone can mint an ORGANIZATION_ADMIN account with no organization.
 * Without the organizationId requirement such an account would pass every
 * org-scoped guard while having no tenant of its own to be scoped to.
 *
 * Use after `authenticate`. For the one route an org-less admin legitimately
 * needs (creating their organization), use `requireOrgAdminRole` instead.
 */
export const requireOrgAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new UnauthorizedException("Access token missing"));
  }

  if (req.user.businessRole !== "ORGANIZATION_ADMIN") {
    return next(new ForbiddenException());
  }

  if (!req.user.organizationId) {
    return next(
      new ForbiddenException("You are not part of any organization"),
    );
  }

  next();
};

/**
 * Like `requireOrgAdmin` but does NOT require an existing organization — for
 * onboarding routes only (i.e. creating the organization itself). Every route
 * that reads or writes tenant data must use `requireOrgAdmin`.
 */
export const requireOrgAdminRole = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new UnauthorizedException("Access token missing"));
  }

  if (req.user.businessRole !== "ORGANIZATION_ADMIN") {
    return next(new ForbiddenException());
  }

  next();
};
