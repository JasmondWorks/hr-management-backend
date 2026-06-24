import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import prisma from "../../core/config/prisma";
import { envConfig } from "../../core/config/env.config";
import {
  ConflictException,
  UnauthorizedException,
} from "../../core/errors/app.error";

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

export class AuthService {
  async register(input: RegisterInput) {
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
        isEmailVerified: false,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  refreshTokens(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        envConfig.jwt.refreshSecret as string,
      ) as jwt.JwtPayload;

      const newAccessToken = this.generateAccessToken(
        payload.userId,
        payload.email,
      );
      const newRefreshToken = this.generateRefreshToken(
        payload.userId,
        payload.email,
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  private generateAccessToken(userId: string, email: string): string {
    const options: SignOptions = {
      expiresIn: envConfig.jwt.accessExpiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign({ userId, email }, envConfig.jwt.accessSecret as string, options);
  }

  private generateRefreshToken(userId: string, email: string): string {
    const options: SignOptions = {
      expiresIn: envConfig.jwt.refreshExpiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign({ userId, email }, envConfig.jwt.refreshSecret as string, options);
  }
}
