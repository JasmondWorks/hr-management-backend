import { BaseRepository } from "../../core/repositories/base.repository";
import prisma from "../../core/config/prisma";
import { Employee } from "../../generated/prisma/client";

export class EmployeeRepository extends BaseRepository<
  Employee,
  typeof prisma.employee
> {
  constructor() {
    super(prisma.employee);
  }
}
