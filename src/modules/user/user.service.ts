import { UserRepository } from "./user.repository";
import { NotFoundException } from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(query: PaginationQuery, organizationId: string) {
    const parsed = parseQuery(query);

    const where: any = { organizationId };

    if (parsed.search) {
      where.OR = [
        { firstName: { contains: parsed.search, mode: "insensitive" as const } },
        { lastName: { contains: parsed.search, mode: "insensitive" as const } },
        { email: { contains: parsed.search, mode: "insensitive" as const } },
      ];
    }

    return this.userRepository.findPaginated(parsed, where);
  }

  /**
   * Reads one user. A caller may always read their own record — including
   * before they belong to any organization, which is the state an invited
   * employee (or a brand-new org admin) is in while onboarding. Reading anyone
   * else still requires sharing an organization with them.
   */
  async getUserById(
    id: string,
    organizationId: string | null,
    requesterId?: string,
  ) {
    const user = await this.userRepository.findById(id);

    const isSelf = Boolean(requesterId) && requesterId === id;
    const isSameOrg =
      Boolean(organizationId) && user?.organizationId === organizationId;

    if (!user || (!isSelf && !isSameOrg)) {
      // Same message for "absent" and "other tenant" so the response cannot be
      // used to probe for user ids outside the caller's organization.
      throw new NotFoundException("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string, organizationId: string) {
    const user = await this.userRepository.findById(id);
    if (!user || user.organizationId !== organizationId) {
      throw new NotFoundException("User not found");
    }
    await this.userRepository.delete(id);
  }
}
