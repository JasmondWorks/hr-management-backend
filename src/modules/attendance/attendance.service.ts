import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { NotificationService } from "../notification/notification.service";

// Local-time midnight for "today" — the per-day key for attendance rows.
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export class AttendanceService {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  private async getEmployeeByUser(userId: string) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) {
      throw new NotFoundException("You do not have an employee profile");
    }
    return employee;
  }

  // Check in for today. Allowed once per day (enforced by the unique key).
  async checkIn(userId: string) {
    const employee = await this.getEmployeeByUser(userId);
    const date = startOfToday();

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });
    if (existing?.checkInTime) {
      throw new ConflictException("You have already checked in today");
    }

    return prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date } },
      create: {
        employeeId: employee.id,
        date,
        checkInTime: new Date(),
        status: "PRESENT",
      },
      update: {
        checkInTime: new Date(),
        status: "PRESENT",
      },
    });
  }

  async checkOut(userId: string) {
    const employee = await this.getEmployeeByUser(userId);
    const date = startOfToday();

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });
    if (!attendance?.checkInTime) {
      throw new BadRequestException("You have not checked in today");
    }
    if (attendance.checkOutTime) {
      throw new ConflictException("You have already checked out today");
    }

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOutTime: new Date() },
    });
  }

  async listForEmployee(userId: string, query: PaginationQuery) {
    const employee = await this.getEmployeeByUser(userId);
    return this.paginate({ employeeId: employee.id }, query);
  }

  async listForOrganization(organizationId: string, query: PaginationQuery & { employeeId?: string }) {
    const where: any = { employee: { organizationId } };
    if (query.employeeId) where.employeeId = query.employeeId;
    return this.paginate(where, query);
  }

  private async paginate(where: any, query: PaginationQuery) {
    const parsed = parseQuery(query, "date");
    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
      }),
      prisma.attendance.count({ where }),
    ]);
    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  // Scheduler entry point: for every org whose configured check-out time has
  // passed today, auto-check-out employees who checked in but never checked out,
  // and notify each of them. Returns how many were auto-checked-out.
  async runAutoCheckout(): Promise<number> {
    // attendanceCheckOutTime lives on Organization; there is no separate
    // organizationSettings model.
    const settingsList = await prisma.organization.findMany({
      select: { id: true, attendanceCheckOutTime: true },
    });
    const now = new Date();
    const today = startOfToday();
    let count = 0;

    for (const settings of settingsList) {
      const [h, m] = settings.attendanceCheckOutTime.split(":").map(Number);
      const checkoutAt = new Date();
      checkoutAt.setHours(h ?? 0, m ?? 0, 0, 0);
      if (now < checkoutAt) continue; // not yet time for this org today

      const pending = await prisma.attendance.findMany({
        where: {
          date: today,
          checkInTime: { not: null },
          checkOutTime: null,
          employee: { organizationId: settings.id },
        },
        include: { employee: true },
      });

      for (const attendance of pending) {
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { checkOutTime: checkoutAt },
        });
        await this.notificationService.create({
          userId: attendance.employee.userId,
          title: "Automatic check-out",
          message: `You were automatically checked out at ${settings.attendanceCheckOutTime}.`,
        });
        count += 1;
      }
    }

    return count;
  }
}
