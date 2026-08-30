import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { NotificationService } from "../notification/notification.service";
import type { GeneratePayrollDto } from "./payroll.dto";

export class PayrollService {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  // Generates PENDING payroll rows for every employee in the org that has a
  // salary set. Idempotent: existing (employee, month, year) rows are skipped.
  async generate(organizationId: string, data: GeneratePayrollDto) {
    const employees = await prisma.employee.findMany({
      where: { organizationId, salary: { not: null } },
    });

    if (employees.length === 0) {
      throw new BadRequestException(
        "No employees with a salary set in your organization",
      );
    }

    const result = await prisma.payroll.createMany({
      data: employees.map((e) => ({
        employeeId: e.id,
        month: data.month,
        year: data.year,
        amount: e.salary as number,
        status: "PENDING" as const,
      })),
      skipDuplicates: true,
    });

    return {
      generated: result.count,
      eligibleEmployees: employees.length,
      skipped: employees.length - result.count,
      month: data.month,
      year: data.year,
    };
  }

  async markPaid(id: string, organizationId: string) {
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!payroll) {
      throw new NotFoundException("Payroll not found");
    }
    if (payroll.employee.organizationId !== organizationId) {
      throw new ForbiddenException("This payroll is not for your organization");
    }
    if (payroll.status === "PAID") {
      throw new BadRequestException("Payroll has already been paid");
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: { status: "PAID" },
    });

    await this.notificationService.create({
      userId: payroll.employee.userId,
      title: "Payroll paid",
      message: `Your payroll for ${payroll.month}/${payroll.year} (${payroll.amount}) has been paid.`,
    });

    return updated;
  }

  async listForOrganization(
    organizationId: string,
    query: PaginationQuery & { month?: number; year?: number; status?: string },
  ) {
    const where: any = { employee: { organizationId } };
    if (query.month) where.month = Number(query.month);
    if (query.year) where.year = Number(query.year);
    if (query.status) where.status = query.status;
    return this.paginate(where, query);
  }

  async listForEmployee(userId: string, query: PaginationQuery) {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) {
      throw new NotFoundException("You do not have an employee profile");
    }
    return this.paginate({ employeeId: employee.id }, query);
  }

  private async paginate(where: any, query: PaginationQuery) {
    const parsed = parseQuery(query);
    const [data, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
      }),
      prisma.payroll.count({ where }),
    ]);
    return { data, total, page: parsed.page, limit: parsed.limit };
  }
}
