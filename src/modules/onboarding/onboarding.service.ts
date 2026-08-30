import prisma from "../../core/config/prisma";
import {
  BadRequestException,
  NotFoundException,
} from "../../core/errors/app.error";
import type { CompleteOnboardingDto } from "./onboarding.dto";

export class OnboardingService {
  // Everything the employee's onboarding form needs: their account, the org-side
  // context an admin already decided (shown read-only), and whatever personal
  // details they have saved so far.
  async getContext(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: { select: { id: true, name: true } },
        employeeProfile: true,
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            officeBranch: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const employee = user.employee;

    return {
      isOnboarded: user.isOnboarded,
      onboardedAt: user.onboardedAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        businessRole: user.businessRole,
      },
      organization: user.organization
        ? { id: user.organization.id, name: user.organization.name }
        : null,
      department: employee?.department ?? null,
      designation: employee?.designation ?? null,
      officeBranch: employee?.officeBranch ?? null,
      joiningDate: employee?.joiningDate ?? null,
      profile: user.employeeProfile ?? null,
    };
  }

  /**
   * Marks the whole flow done without touching the profile — used by the
   * organization admin wizard, whose last step is inviting people rather than
   * filling in personal details.
   *
   * Refuses while the admin has no organization, so the flag can never be set
   * before the step that actually matters has run.
   */
  async markComplete(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (!user.organizationId) {
      throw new BadRequestException(
        "Create your organization before finishing onboarding",
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true, onboardedAt: new Date() },
    });

    return this.getContext(userId);
  }

  async complete(userId: string, data: CompleteOnboardingDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    // EmployeeProfile.organizationId is non-null, so there is nothing sensible to
    // write for a user who belongs to no organization.
    if (!user.organizationId) {
      throw new BadRequestException("You are not part of any organization");
    }
    // Bound to a local so the narrowing survives into the transaction closure.
    const organizationId = user.organizationId;

    const { firstName, lastName, phone, ...profileFields } = data;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phone,
          isOnboarded: true,
          onboardedAt: new Date(),
        },
      });

      // Upserted rather than updated: the profile row is created at invite
      // acceptance, but an employee created by the legacy admin flow may not
      // have one.
      await tx.employeeProfile.upsert({
        where: { userId },
        create: {
          userId,
          organizationId,
          ...profileFields,
        },
        update: profileFields,
      });
    });

    return this.getContext(userId);
  }
}
