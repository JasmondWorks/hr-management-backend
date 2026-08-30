import prisma from "../../core/config/prisma";
import { ConflictException, NotFoundException } from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import type { CreateDepartmentDto } from "./department.dto";

export class DepartmentService {
  async createDepartment(organizationId: string, data: CreateDepartmentDto) {
    const existing = await prisma.department.findFirst({
      where: { organizationId, name: data.name },
    });
    if (existing) {
      throw new ConflictException(
        "A department with this name already exists in your organization",
      );
    }

    return prisma.department.create({
      data: { 
        name: data.name, 
        description: data.description,
        location: data.location,
        organizationId 
      },
    });
  }

  async listDepartments(organizationId: string, query: PaginationQuery) {
    const parsed = parseQuery(query);
    const where = { organizationId };

    const [data, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: parsed.skip,
        take: parsed.limit,
        orderBy: { [parsed.sortBy]: parsed.order },
        include: {
          employees: {
            include: {
              user: { omit: { password: true } },
            },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return { data, total, page: parsed.page, limit: parsed.limit };
  }

  async getDepartmentById(id: string, organizationId: string) {
    const department = await prisma.department.findUnique({
      where: { id, organizationId },
      include: {
        employees: {
          include: {
            user: { omit: { password: true } },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException("Department not found");
    }

    return department;
  }
}
