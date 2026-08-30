import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { CandidateRepository } from "../candidate/candidate.repository";

const NON_TERMINAL_STATUSES = ["APPLIED", "INTERVIEW", "OFFERED"] as const;

export class ApplicationService {
  // A CANDIDATE user applies to an open job.
  async apply(userId: string, jobId: string) {
    const candidate = await prisma.candidate.findUnique({ where: { userId } });
    if (!candidate) {
      throw new NotFoundException("Candidate profile not found");
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    if (job.status !== "OPEN") {
      throw new BadRequestException("This job is not open for applications");
    }

    const duplicate = await prisma.application.findFirst({
      where: { candidateId: candidate.id, jobId },
    });
    if (duplicate) {
      throw new ConflictException("You have already applied to this job");
    }

    return prisma.application.create({
      data: { jobId, candidateId: candidate.id },
    });
  }

  // Applications for jobs owned by the admin's organization.
  async listForOrganization(organizationId: string, query: PaginationQuery) {
    const parsed = parseQuery(query, "appliedAt");
    const where = { 
      job: { department: { organizationId } },
      candidate: { isDeleted: false }
    };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
        include: { candidate: true, job: true },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  // Applications submitted by the candidate themselves.
  async listForCandidate(userId: string, query: PaginationQuery) {
    const candidate = await prisma.candidate.findUnique({ where: { userId } });
    if (!candidate) {
      throw new NotFoundException("Candidate profile not found");
    }

    const parsed = parseQuery(query, "appliedAt");
    const where = { candidateId: candidate.id };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
        include: { job: { include: { department: true } } },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  // Accept an application: mark ACCEPTED, promote the candidate's user to an
  // EMPLOYEE of this organization, create the Employee record, and close the
  // candidate's other still-open applications (one user belongs to one org).
  async accept(applicationId: string, organizationId: string) {
    const application = await this.getApplicationForAdmin(
      applicationId,
      organizationId,
    );

    return prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      });

      await tx.user.update({
        where: { id: application.candidate.userId },
        data: { role: "EMPLOYEE", organizationId, businessRole: "REGULAR" },
      });

      const employee = await tx.employee.create({
        data: { userId: application.candidate.userId, organizationId },
      });

      await tx.application.updateMany({
        where: {
          candidateId: application.candidateId,
          id: { not: applicationId },
          status: { in: [...NON_TERMINAL_STATUSES] },
        },
        data: { status: "REJECTED" },
      });

      // Soft delete the candidate using the repository
      const candidateRepo = new CandidateRepository().withTransaction(tx.candidate);
      await candidateRepo.softDelete(application.candidateId);

      return { application: updated, employee };
    });
  }

  async reject(applicationId: string, organizationId: string) {
    await this.getApplicationForAdmin(applicationId, organizationId);

    return prisma.application.update({
      where: { id: applicationId },
      data: { status: "REJECTED" },
    });
  }

  // Loads an application, verifies it belongs to the admin's organization and is
  // still actionable (not already accepted/rejected).
  private async getApplicationForAdmin(
    applicationId: string,
    organizationId: string,
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: { include: { department: true } },
      },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }
    if (application.job.department.organizationId !== organizationId) {
      throw new ForbiddenException(
        "This application is not for your organization",
      );
    }
    if (
      application.status === "ACCEPTED" ||
      application.status === "REJECTED"
    ) {
      throw new BadRequestException(
        `Application has already been ${application.status.toLowerCase()}`,
      );
    }

    return application;
  }
}
