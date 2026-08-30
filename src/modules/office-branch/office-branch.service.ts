import prisma from "../../core/config/prisma";
import {
  ConflictException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import type {
  CreateOfficeBranchDto,
  UpdateOfficeBranchDto,
} from "./office-branch.dto";

export class OfficeBranchService {
  async createOfficeBranch(
    organizationId: string,
    data: CreateOfficeBranchDto,
  ) {
    const existing = await prisma.officeBranch.findFirst({
      where: { organizationId, name: data.name },
    });
    if (existing) {
      throw new ConflictException(
        "An office branch with this name already exists in your organization",
      );
    }

    return prisma.$transaction(async (tx) => {
      // Only one branch may be the headquarters, so promoting one demotes the rest.
      if (data.isHeadquarters) {
        await tx.officeBranch.updateMany({
          where: { organizationId, isHeadquarters: true },
          data: { isHeadquarters: false },
        });
      }

      return tx.officeBranch.create({
        data: { ...data, organizationId },
      });
    });
  }

  async listOfficeBranches(organizationId: string, query: PaginationQuery) {
    const parsed = parseQuery(query);
    const where = { organizationId };

    const [data, total] = await Promise.all([
      prisma.officeBranch.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
      }),
      prisma.officeBranch.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  async getOfficeBranchById(id: string, organizationId: string) {
    const branch = await prisma.officeBranch.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { jobs: true, employees: true } },
      },
    });

    if (!branch) {
      throw new NotFoundException("Office branch not found");
    }

    return branch;
  }

  async updateOfficeBranch(
    id: string,
    organizationId: string,
    data: UpdateOfficeBranchDto,
  ) {
    await this.assertBranchInOrg(id, organizationId);

    if (data.name) {
      const clash = await prisma.officeBranch.findFirst({
        where: { organizationId, name: data.name, id: { not: id } },
      });
      if (clash) {
        throw new ConflictException(
          "An office branch with this name already exists in your organization",
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      if (data.isHeadquarters) {
        await tx.officeBranch.updateMany({
          where: { organizationId, isHeadquarters: true, id: { not: id } },
          data: { isHeadquarters: false },
        });
      }

      return tx.officeBranch.update({ where: { id }, data });
    });
  }

  async deleteOfficeBranch(id: string, organizationId: string) {
    await this.assertBranchInOrg(id, organizationId);

    // Jobs and employees hold a nullable reference, so the database would let the
    // delete through and orphan them silently. Refuse instead and let the admin
    // reassign first.
    const [jobs, employees] = await Promise.all([
      prisma.job.count({ where: { officeBranchId: id } }),
      prisma.employee.count({ where: { officeBranchId: id } }),
    ]);

    if (jobs > 0 || employees > 0) {
      throw new ConflictException(
        `This branch is still referenced by ${jobs} job(s) and ${employees} employee(s). Reassign them before deleting it.`,
      );
    }

    await prisma.officeBranch.delete({ where: { id } });
  }

  // Shared guard: a branch id supplied by a caller must belong to that caller's
  // organization. Used here and by the job module.
  async assertBranchInOrg(id: string, organizationId: string) {
    const branch = await prisma.officeBranch.findFirst({
      where: { id, organizationId },
    });
    if (!branch) {
      throw new NotFoundException("Office branch not found");
    }
    return branch;
  }
}
