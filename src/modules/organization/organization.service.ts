import prisma from "../../core/config/prisma";
import { OrganizationRepository } from "./organization.repository";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import type { CreateOrganizationDto } from "./organization.dto";

export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async createOrganization(data: CreateOrganizationDto, creatorId: string) {
    // One user belongs to exactly one organization. Without this, an admin who
    // already has a tenant could create a second one and have their own
    // organizationId reassigned to it.
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { organizationId: true },
    });
    if (creator?.organizationId) {
      throw new BadRequestException(
        "You already belong to an organization",
      );
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await this.organizationRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(
        "An organization with a similar name already exists",
      );
    }

    const existingEmail = await this.organizationRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException(
        "An organization with this email address already exists",
      );
    }

    const { logoUrl, websiteUrl, ...rest } = data;

    const org = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          ...rest,
          slug,
          logoUrl,
          websiteUrl,
          creatorId,
        },
      });

      await tx.user.update({
        where: { id: creatorId },
        data: { organizationId: organization.id },
      });

      // The founder is a member of staff too. Without an Employee row they are
      // absent from the employee list and headcount, and cannot be given a
      // department, salary, leave, attendance or payroll — all of which hang off
      // Employee rather than User.
      await tx.employee.create({
        data: {
          userId: creatorId,
          organizationId: organization.id,
        },
      });

      // Invited staff get their profile row when they accept; the founder never
      // passes through that path, so create it here to keep the shapes equal.
      await tx.employeeProfile.create({
        data: {
          userId: creatorId,
          organizationId: organization.id,
        },
      });

      return organization;
    });

    return org;
  }

  async updateOrganization(organizationId: string, data: any) {
    const existing = await this.organizationRepository.findById(organizationId);
    if (!existing) {
      throw new NotFoundException("Organization not found");
    }

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      
      const slugExists = await this.organizationRepository.findBySlug(slug);
      if (slugExists && slugExists.id !== organizationId) {
        throw new ConflictException("An organization with a similar name already exists");
      }
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await this.organizationRepository.findByEmail(data.email);
      if (emailExists && emailExists.id !== organizationId) {
        throw new ConflictException("An organization with this email address already exists");
      }
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: { ...data, slug },
    });
  }

  async getMyOrganization(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new NotFoundException("You are not part of any organization");
    }

    const org = await this.organizationRepository.findById(user.organizationId);
    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return org;
  }

  async getOrganizationUsers(userId: string, query: PaginationQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new NotFoundException("You are not part of any organization");
    }

    const parsed = parseQuery(query);

    const where: any = { organizationId: user.organizationId };

    if (parsed.search) {
      where.OR = [
        {
          firstName: { contains: parsed.search, mode: "insensitive" as const },
        },
        { lastName: { contains: parsed.search, mode: "insensitive" as const } },
        { email: { contains: parsed.search, mode: "insensitive" as const } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
        omit: { password: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  async addUserToOrganization(adminUserId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { organizationId: true },
    });

    if (!admin?.organizationId) {
      throw new NotFoundException("You are not part of any organization");
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundException("User not found");
    }

    if (target.organizationId === admin.organizationId) {
      throw new BadRequestException("User is already in this organization");
    }

    if (target.organizationId) {
      throw new BadRequestException(
        "User already belongs to another organization",
      );
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { organizationId: admin.organizationId },
      omit: { password: true },
    });

    return updated;
  }

  async removeUserFromOrganization(adminUserId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { organizationId: true },
    });

    if (!admin?.organizationId) {
      throw new NotFoundException("You are not part of any organization");
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { organizationId: true },
    });

    if (!target) {
      throw new NotFoundException("User not found");
    }

    if (target.organizationId !== admin.organizationId) {
      throw new BadRequestException("User is not in your organization");
    }

    if (targetUserId === adminUserId) {
      throw new BadRequestException(
        "You cannot remove yourself from the organization",
      );
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { organizationId: null },
      omit: { password: true },
    });

    return updated;
  }

  async getAllOrganizations(query: PaginationQuery) {
    const parsed = parseQuery(query);

    const where = parsed.search
      ? {
          OR: [
            { name: { contains: parsed.search, mode: "insensitive" as const } },
            { slug: { contains: parsed.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return this.organizationRepository.findPaginated(parsed, where);
  }

  async getOrganizationById(id: string) {
    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return org;
  }

  async deleteOrganization(id: string) {
    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    await this.organizationRepository.delete(id);
  }
}
