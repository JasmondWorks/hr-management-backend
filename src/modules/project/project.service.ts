import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { NotificationService } from "../notification/notification.service";
import type { CreateProjectDto, UpdateProjectDto } from "./project.dto";

type ProjectStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

const collaboratorSelect = {
  collaborators: {
    select: { id: true, userId: true, departmentId: true },
  },
};

export class ProjectService {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  async create(userId: string, organizationId: string, data: CreateProjectDto) {
    if (data.finishDate && data.finishDate < data.startDate) {
      throw new BadRequestException("Finish date cannot be before start date");
    }

    const collaborators = await this.resolveCollaborators(
      organizationId,
      data.collaboratorIds ?? [],
    );

    const project = await prisma.project.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        finishDate: data.finishDate ?? null,
        status: data.status,
        timeline: data.timeline,
        organizationId,
        createdById: userId,
        collaborators: { connect: collaborators.map((c) => ({ id: c.id })) },
      },
      include: collaboratorSelect,
    });

    await this.notifyUsers(
      collaborators.map((c) => c.userId),
      "Added to a project",
      `You have been added as a collaborator on project "${project.name}".`,
    );

    return project;
  }

  async list(
    organizationId: string,
    query: PaginationQuery & { status?: string; employeeId?: string },
  ) {
    const parsed = parseQuery(query);
    const where: any = { organizationId };
    if (query.status) where.status = query.status;
    if (query.employeeId) where.collaborators = { some: { id: query.employeeId } };

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
        include: collaboratorSelect,
      }),
      prisma.project.count({ where }),
    ]);
    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  // Projects the calling employee is a collaborator on.
  async listForEmployee(
    userId: string,
    query: PaginationQuery & { status?: string },
  ) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) {
      throw new NotFoundException("You do not have an employee profile");
    }

    const parsed = parseQuery(query);
    const where: any = { collaborators: { some: { id: employee.id } } };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
        include: collaboratorSelect,
      }),
      prisma.project.count({ where }),
    ]);
    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  async getById(id: string, organizationId: string) {
    return this.getOwnedProject(id, organizationId);
  }

  async update(id: string, organizationId: string, data: UpdateProjectDto) {
    const project = await this.getOwnedProject(id, organizationId);

    const startDate = data.startDate ?? project.startDate;
    const finishDate =
      data.finishDate === undefined ? project.finishDate : data.finishDate;
    if (finishDate && finishDate < startDate) {
      throw new BadRequestException("Finish date cannot be before start date");
    }

    return prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate,
        finishDate: data.finishDate,
        timeline: data.timeline,
      },
      include: collaboratorSelect,
    });
  }

  async updateStatus(id: string, organizationId: string, status: ProjectStatus) {
    const project = await this.getOwnedProject(id, organizationId);

    const updated = await prisma.project.update({
      where: { id },
      data: { status },
      include: collaboratorSelect,
    });

    await this.notifyUsers(
      project.collaborators.map((c) => c.userId),
      "Project status updated",
      `Project "${project.name}" is now ${status.replace("_", " ").toLowerCase()}.`,
    );

    return updated;
  }

  async addCollaborators(
    id: string,
    organizationId: string,
    employeeIds: string[],
  ) {
    await this.getOwnedProject(id, organizationId);
    const collaborators = await this.resolveCollaborators(
      organizationId,
      employeeIds,
    );

    const updated = await prisma.project.update({
      where: { id },
      data: {
        collaborators: { connect: collaborators.map((c) => ({ id: c.id })) },
      },
      include: collaboratorSelect,
    });

    await this.notifyUsers(
      collaborators.map((c) => c.userId),
      "Added to a project",
      `You have been added as a collaborator on project "${updated.name}".`,
    );

    return updated;
  }

  async removeCollaborator(
    id: string,
    organizationId: string,
    employeeId: string,
  ) {
    await this.getOwnedProject(id, organizationId);
    return prisma.project.update({
      where: { id },
      data: { collaborators: { disconnect: { id: employeeId } } },
      include: collaboratorSelect,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.getOwnedProject(id, organizationId);
    await prisma.project.delete({ where: { id } });
  }

  // --- helpers ---

  private async getOwnedProject(id: string, organizationId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: collaboratorSelect,
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (project.organizationId !== organizationId) {
      throw new ForbiddenException("This project is not in your organization");
    }
    return project;
  }

  private async resolveCollaborators(
    organizationId: string,
    employeeIds: string[],
  ) {
    if (employeeIds.length === 0) return [];
    const unique = [...new Set(employeeIds)];
    const employees = await prisma.employee.findMany({
      where: { id: { in: unique }, organizationId },
      select: { id: true, userId: true },
    });
    if (employees.length !== unique.length) {
      throw new BadRequestException(
        "Some employees were not found in your organization",
      );
    }
    return employees;
  }

  private async notifyUsers(userIds: string[], title: string, message: string) {
    if (userIds.length === 0) return;
    await this.notificationService.createMany(userIds, message, title);
  }
}
