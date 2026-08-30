import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ForbiddenException } from "../errors/app.error";

// Business roles that run the organization. They are exempt: an admin or HR
// lead does not need to sit in a department to do their job, and the org
// founder has nobody above them to assign one.
const EXEMPT_BUSINESS_ROLES = new Set([
  "ORGANIZATION_ADMIN",
  "DEPARTMENT_ADMIN",
  "HR",
]);

// Paths a department-less employee must still reach: their own session, their
// onboarding, their profile, and their notifications (which is how they would
// be told they have been placed in one).
const EXEMPT_PATH_PREFIXES = ["/auth", "/me", "/notifications", "/uploads"];

const isExemptPath = (path: string) =>
  EXEMPT_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

/**
 * Blocks a regular employee who has not been placed in a department from
 * changing anything in the organization.
 *
 * An invited employee who has accepted and filled in their details is a real
 * account, but until an admin assigns them a department they are not yet part
 * of the organization's structure — they have no team, no designation, and no
 * business booking leave or logging attendance against nothing. Reads are left
 * alone so the frontend can render the explanatory screen.
 *
 * The check reads the database rather than the token's `departmentId` claim: a
 * token minted before the assignment would otherwise keep them locked out (or,
 * on removal, keep them in) until it refreshed.
 */
export const requireDepartmentForWrites = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  // Unauthenticated requests are the individual routers' problem, not ours.
  if (!user) return next();

  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (isExemptPath(req.path)) return next();

  // Only organization staff are in scope; candidates and platform admins have
  // no department concept at all.
  if (user.role !== "EMPLOYEE") return next();
  if (user.businessRole && EXEMPT_BUSINESS_ROLES.has(user.businessRole)) {
    return next();
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: user.userId },
      select: { departmentId: true },
    });

    if (!employee?.departmentId) {
      return next(
        new ForbiddenException(
          "You have not been assigned to a department yet. Your organization admin needs to place you in one before you can do this.",
        ),
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
