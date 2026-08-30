import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import prisma from "../../core/config/prisma";
import { envConfig } from "../../core/config/env.config";
import {
  ConflictException,
  UnauthorizedException,
} from "../../core/errors/app.error";
import type { RoleType, BusinessRole } from "../../generated/prisma/client";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: RoleType;
  businessRole: BusinessRole | null;
  organizationId: string | null;
  // False until every step of the user's onboarding flow is done. Kept in the
  // token so the frontend can gate routing without an extra request;
  // refreshTokens re-reads the user, so it updates on the next refresh.
  isOnboarded: boolean;
  // The employee's department, or null while an admin has not placed them in
  // one. Regular staff cannot act in the organization until this is set, so the
  // frontend needs it to gate routing. Authorization is still enforced server
  // side against the database, never against this claim.
  departmentId: string | null;
}

export class AuthService {
  async registerWithRole(
    input: RegisterInput,
    role: RoleType,
    businessRole: BusinessRole | null = null,
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role,
        businessRole,
        isEmailVerified: false,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // A candidate is a User(role=CANDIDATE) plus a linked Candidate entity that
  // owns their applications. Promotion later flips this user to EMPLOYEE.
  async registerCandidate(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const { user, candidate } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: "CANDIDATE",
          businessRole: null,
          isEmailVerified: false,
        },
      });

      const candidate = await tx.candidate.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          userId: user.id,
        },
      });

      return { user, candidate };
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, candidate };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { employee: { select: { departmentId: true } } },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessRole: user.businessRole,
      organizationId: user.organizationId,
      isOnboarded: user.isOnboarded,
      departmentId: user.employee?.departmentId ?? null,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    const { password: _, employee: __, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        envConfig.jwt.refreshSecret as string,
      ) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Re-read the user so the refreshed tokens reflect current state (e.g. an
    // organizationId assigned after the previous token was issued). Without
    // this, claims like organizationId stay stale for the life of the session.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: { select: { departmentId: true } } },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessRole: user.businessRole ?? null,
      organizationId: user.organizationId ?? null,
      isOnboarded: user.isOnboarded,
      departmentId: user.employee?.departmentId ?? null,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: envConfig.jwt.accessExpiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign(
      { ...payload },
      envConfig.jwt.accessSecret as string,
      options,
    );
  }

  private generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: envConfig.jwt.refreshExpiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign(
      { ...payload },
      envConfig.jwt.refreshSecret as string,
      options,
    );
  }
}
