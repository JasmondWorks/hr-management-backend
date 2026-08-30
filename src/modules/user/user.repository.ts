import { BaseRepository } from "../../core/repositories/base.repository";
import prisma from "../../core/config/prisma";
import { User } from "../../generated/prisma/client";

export class UserRepository extends BaseRepository<User, typeof prisma.user> {
  constructor() {
    // Pass the specific Prisma model delegate to the BaseRepository
    super(prisma.user);
  }
}
