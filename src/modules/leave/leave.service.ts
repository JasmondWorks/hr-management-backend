import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { NotificationService } from "../notification/notification.service";
import type { CreateLeaveDto } from "./leave.dto";

export class LeaveService {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  async request(userId: string, data: CreateLeaveDto) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) {
      throw new NotFoundException("You do not have an employee profile");
    }
    if (data.endDate < data.startDate) {
      throw new BadRequestException("End date cannot be before start date");
    }

    return prisma.leave.create({
      data: {
        employeeId: employee.id,
        startDate: data.startDate,
        endDate: data.endDate,
        leaveType: data.leaveType,
        leaveReason: data.leaveReason,
      },
    });
  }

  async listForEmployee(userId: string, query: PaginationQuery) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) {
      throw new NotFoundException("You do not have an employee profile");
    }
    return this.paginate({ employeeId: employee.id }, query);
  }

  async listForOrganization(
    organizationId: string,
    query: PaginationQuery & { status?: string; employeeId?: string },
  ) {
    const where: any = { employee: { organizationId } };
    if (query.status) where.status = query.status;
    if (query.employeeId) where.employeeId = query.employeeId;
    return this.paginate(where, query);
  }

  async approve(id: string, organizationId: string) {
    return this.decide(id, organizationId, "APPROVED");
  }

  async reject(id: string, organizationId: string) {
    return this.decide(id, organizationId, "REJECTED");
  }

  private async decide(
    id: string,
    organizationId: string,
    status: "APPROVED" | "REJECTED",
  ) {
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leave) {
      throw new NotFoundException("Leave request not found");
    }
    if (leave.employee.organizationId !== organizationId) {
      throw new ForbiddenException(
        "This leave request is not for your organization",
      );
    }
    if (leave.status !== "PENDING") {
      throw new BadRequestException(
        `Leave request has already been ${leave.status.toLowerCase()}`,
      );
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: { status },
    });

    await this.notificationService.create({
      userId: leave.employee.userId,
      title: `Leave ${status.toLowerCase()}`,
      message: `Your ${leave.leaveType.toLowerCase()} leave request has been ${status.toLowerCase()}.`,
    });

    return updated;
  }

  private async paginate(where: any, query: PaginationQuery) {
    const parsed = parseQuery(query);
    const [data, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
      }),
      prisma.leave.count({ where }),
    ]);
    return { data, total, page: parsed.page, limit: parsed.limit };
  }
}
