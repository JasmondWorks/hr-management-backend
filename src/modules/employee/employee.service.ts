import prisma from "../../core/config/prisma";
import { EmployeeRepository } from "./employee.repository";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../core/errors/app.error";
import { parseQuery, type PaginationQuery } from "../../core/dto/query.dto";
import type { AssignDepartmentDto } from "./employee.dto";

// Relations the employee list and detail views both render: the account, and the
// department, designation and branch they currently sit in.
const EMPLOYEE_INCLUDE = {
  user: { omit: { password: true as const } },
  department: { select: { id: true, name: true } },
  designation: { select: { id: true, name: true } },
  officeBranch: { select: { id: true, name: true, isHeadquarters: true } },
} as const;

export class EmployeeService {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async getAllEmployees(query: PaginationQuery, organizationId: string) {
    const parsed = parseQuery(query);
    return this.employeeRepository.findPaginated(
      parsed,
      { organizationId },
      { include: EMPLOYEE_INCLUDE },
    );
  }

  async getEmployeeById(id: string, organizationId: string) {
    const employee = await this.employeeRepository.findById(id, {
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    this.assertEmployeeInOrg(employee, organizationId);
    return employee;
  }

  async deleteEmployee(id: string, organizationId: string) {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    this.assertEmployeeInOrg(employee, organizationId);
    await this.employeeRepository.delete(id);
  }

  // Assigns/moves an employee to a department (or clears it with null). Both the
  // employee and the department must belong to the admin's organization.
  // Assigns the department, and with it the designation — the two are one fact.
  // A designation belongs to a department, so moving someone without clearing it
  // would leave them holding a title from a team they are no longer on.
  async assignDepartment(
    id: string,
    organizationId: string,
    data: AssignDepartmentDto,
  ) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    if (employee.organizationId !== organizationId) {
      throw new ForbiddenException(
        "This employee is not part of your organization",
      );
    }

    if (data.departmentId) {
      await this.assertDepartmentInOrg(data.departmentId, organizationId);
    }

    if (data.designationId) {
      if (!data.departmentId) {
        throw new BadRequestException(
          "A designation can only be set together with its department",
        );
      }
      const designation = await prisma.departmentDesignation.findFirst({
        where: { id: data.designationId, departmentId: data.departmentId },
      });
      if (!designation) {
        throw new NotFoundException(
          "Designation not found in the selected department",
        );
      }
    }

    return prisma.employee.update({
      where: { id },
      data: {
        departmentId: data.departmentId,
        // Null unless a designation valid for the new department was supplied.
        designationId: data.designationId ?? null,
      },
    });
  }

  async setSalary(id: string, organizationId: string, salary: number) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    if (employee.organizationId !== organizationId) {
      throw new ForbiddenException(
        "This employee is not part of your organization",
      );
    }
    return prisma.employee.update({ where: { id }, data: { salary } });
  }

  async updateBusinessRole(id: string, organizationId: string, businessRole: string) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    if (employee.organizationId !== organizationId) {
      throw new ForbiddenException(
        "This employee is not part of your organization",
      );
    }
    
    // Update the business role on the user record associated with the employee
    const updatedUser = await prisma.user.update({
      where: { id: employee.userId },
      data: { businessRole: businessRole as any }, // casting to any because of enum type in Prisma
    });

    return { ...employee, user: updatedUser };
  }

  // Employees are only ever visible/mutable within their own organization.
  // Reported as "not found" rather than "forbidden" so an admin in another
  // tenant cannot use the response to confirm that an employee id exists.
  private assertEmployeeInOrg(
    employee: { organizationId: string },
    organizationId: string,
  ) {
    if (employee.organizationId !== organizationId) {
      throw new NotFoundException("Employee not found");
    }
  }

  private async assertDepartmentInOrg(
    departmentId: string,
    organizationId: string,
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
}
