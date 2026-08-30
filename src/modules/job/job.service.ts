import prisma from "../../core/config/prisma";
import {
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import type { AuthPayload } from "../../core/middlewares/auth.middleware";
import type { CreateJobDto, UpdateJobDto } from "./job.dto";
import { OfficeBranchService } from "../office-branch/office-branch.service";

export class JobService {
  private readonly officeBranchService = new OfficeBranchService();

  // Department admin creates a job under a department their org owns. The
  // designation (title) is created-or-reused by name within the department.
  async createJob(organizationId: string, data: CreateJobDto) {
    await this.assertDepartmentOwned(organizationId, data.departmentId);
    if (data.officeBranchId) {
      await this.officeBranchService.assertBranchInOrg(
        data.officeBranchId,
        organizationId,
      );
    }

    return prisma.$transaction(async (tx) => {
      const designation = await this.upsertDesignation(
        tx,
        data.departmentId,
        data.designation,
      );

      return tx.job.create({
        data: {
          name: data.name,
          description: data.description,
          amount: data.amount,
          workLocation: data.workLocation,
          contractType: data.contractType,
          contractDuration: data.contractDuration,
          departmentId: data.departmentId,
          departmentDesignationId: designation.id,
          officeBranchId: data.officeBranchId ?? null,
          organizationId,
        },
      });
    });
  }

  // Org members see their organization's jobs (any status, optional filters).
  // Candidates (no organization) browse OPEN jobs across all organizations.
  async listJobs(
    user: AuthPayload | undefined,
    query: PaginationQuery & Record<string, string>,
    mineOnly: boolean = false,
  ) {
    const parsed = parseQuery(query);

    const where: any = {};
    const departmentFilter: any = {};

    if (mineOnly) {
      if (!user?.organizationId) {
        throw new ForbiddenException("You are not part of any organization");
      }
      departmentFilter.organizationId = user.organizationId;
      if (query.status) where.status = query.status;
    } else {
      where.status = "OPEN";
    }
    if (query.departmentId) departmentFilter.id = query.departmentId;
    if (Object.keys(departmentFilter).length)
      where.department = departmentFilter;

    if (query.officeBranchId) where.officeBranchId = query.officeBranchId;
    if (query.workLocation) where.workLocation = query.workLocation;
    if (query.contractType) where.contractType = query.contractType;
    if (parsed.search) {
      where.OR = [
        { name: { contains: parsed.search, mode: "insensitive" as const } },
        {
          description: {
            contains: parsed.search,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { id: parsed.order },
        include: {
          departmentDesignation: true,
          department: true,
          organization: true,
          officeBranch: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  // Mirrors the visibility rule in listJobs: members of the owning organization
  // see the job whatever its status; everyone else (candidates / anonymous) only
  // sees OPEN jobs. Without the status check a closed or draft posting from
  // another tenant is readable by anyone who guesses or harvests its id.
  async getJobById(id: string, user?: AuthPayload) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        departmentDesignation: true,
        department: true,
        officeBranch: true,
      },
    });
    if (!job) {
      throw new NotFoundException("Job not found");
    }

    const isOrgMember =
      !!user?.organizationId &&
      user.organizationId === job.department.organizationId;

    if (!isOrgMember && job.status !== "OPEN") {
      throw new NotFoundException("Job not found");
    }

    return job;
  }

  async updateJob(organizationId: string, id: string, data: UpdateJobDto) {
    const job = await this.getOwnedJob(organizationId, id);

    if (data.officeBranchId) {
      await this.officeBranchService.assertBranchInOrg(
        data.officeBranchId,
        organizationId,
      );
    }

    return prisma.$transaction(async (tx) => {
      let departmentDesignationId: string | undefined;
      if (data.designation) {
        const designation = await this.upsertDesignation(
          tx,
          job.departmentId,
          data.designation,
        );
        departmentDesignationId = designation.id;
      }

      return tx.job.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          amount: data.amount,
          workLocation: data.workLocation,
          contractType: data.contractType,
          contractDuration: data.contractDuration,
          status: data.status,
          departmentDesignationId,
          // `undefined` leaves it alone; an explicit null clears it.
          officeBranchId: data.officeBranchId,
        },
      });
    });
  }

  async deleteJob(organizationId: string, id: string) {
    await this.getOwnedJob(organizationId, id);
    await prisma.job.delete({ where: { id } });
  }

  // --- helpers ---

  private async upsertDesignation(tx: any, departmentId: string, name: string) {
    const trimmed = name.trim();
    const existing = await tx.departmentDesignation.findFirst({
      where: { departmentId, name: trimmed },
    });
    if (existing) return existing;
    return tx.departmentDesignation.create({
      data: { name: trimmed, departmentId },
    });
  }

  private async assertDepartmentOwned(
    organizationId: string,
    departmentId: string,
  ) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new NotFoundException("Department not found");
    }
    if (department.organizationId !== organizationId) {
      throw new ForbiddenException(
        "This department is not part of your organization",
      );
    }
    return department;
  }

  private async getOwnedJob(organizationId: string, id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    if (job.department.organizationId !== organizationId) {
      throw new ForbiddenException("This job is not part of your organization");
    }
    return job;
  }
}
