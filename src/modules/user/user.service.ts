import { UserRepository } from "./user.repository";
import { NotFoundException } from "../../core/errors/app.error";
import type { User } from "../../generated/prisma/client";

export class UserService {
  private userRepository = new UserRepository();

  async getAllUsers(query: { page?: string; limit?: string }) {
    const result = await this.userRepository.findPaginated(
      { page: Number(query.page) || 1, limit: Number(query.limit) || 10 },
    );
    return result;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.userRepository.delete(id);
  }
}
