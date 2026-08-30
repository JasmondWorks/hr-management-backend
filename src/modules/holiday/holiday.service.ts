import prisma from "../../core/config/prisma";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import { NotificationService } from "../notification/notification.service";
import type { CreateHolidayDto } from "./holiday.dto";

export class HolidayService {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  // Creates an org-wide holiday and notifies every member of the organization.
  async create(organizationId: string, data: CreateHolidayDto) {
    const existing = await prisma.holiday.findUnique({
      where: { organizationId_date: { organizationId, date: data.date } },
    });
    if (existing) {
      throw new ConflictException("A holiday already exists on this date");
    }

    const holiday = await prisma.holiday.create({
      data: { organizationId, name: data.name, date: data.date },
    });

    const members = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });
    await this.notificationService.createMany(
      members.map((m) => m.id),
      `New holiday: ${holiday.name} on ${holiday.date.toDateString()}.`,
      "Holiday announced",
    );

    return holiday;
  }

  async list(organizationId: string, query: PaginationQuery) {
    const parsed = parseQuery(query, "date");
    const where = { organizationId };
    const [data, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
      }),
      prisma.holiday.count({ where }),
    ]);
    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  async remove(id: string, organizationId: string) {
    const holiday = await prisma.holiday.findUnique({ where: { id } });
    if (!holiday) {
      throw new NotFoundException("Holiday not found");
    }
    if (holiday.organizationId !== organizationId) {
      throw new ForbiddenException("This holiday is not for your organization");
    }
    await prisma.holiday.delete({ where: { id } });
  }
}
