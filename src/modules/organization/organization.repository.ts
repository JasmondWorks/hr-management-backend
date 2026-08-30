import { BaseRepository } from "../../core/repositories/base.repository";
import prisma from "../../core/config/prisma";
import { Organization, Prisma } from "../../generated/prisma/client";

// Organization plus its relation fields (users, departments), fully typed.
// Prisma.<Model>GetPayload<{ include }> derives the exact shape for you.
export type OrganizationWithRelations = Prisma.OrganizationGetPayload<{
  include: { users: { omit: { password: true } }; departments: true };
}>;

export class OrganizationRepository extends BaseRepository<
  Organization,
  typeof prisma.organization
> {
  constructor() {
    super(prisma.organization);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.model.findUnique({ where: { slug } });
  }

  async findByEmail(email: string): Promise<Organization | null> {
    return this.model.findUnique({ where: { email } });
  }

  // Convenience wrapper: always returns the relation-loaded, typed shape.
  async findByIdWithRelations(
    id: string,
  ): Promise<OrganizationWithRelations | null> {
    return this.findById<OrganizationWithRelations>(id, {
      include: { users: { omit: { password: true } }, departments: true },
    });
  }
}
