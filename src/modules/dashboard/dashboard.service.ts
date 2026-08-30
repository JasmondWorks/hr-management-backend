import prisma from "../../core/config/prisma";

export class DashboardService {
  async getAdminStats(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // 1. Total Employees
    const currentEmployeesCount = await prisma.employee.count({
      where: { organizationId }
    });
    const lastMonthEmployeesCount = await prisma.employee.count({
      where: {
        organizationId,
        createdAt: { lte: lastDayOfLastMonth }
      }
    });

    const employeesDelta = this.calculateDelta(currentEmployeesCount, lastMonthEmployeesCount);

    // 2. Total Applicants
    // Applicants are organization scoped indirectly (we'll fetch Candidates who applied to Jobs in this Org's Departments)
    const currentApplicantsCount = await prisma.application.count({
      where: {
        job: { department: { organizationId } },
        candidate: { isDeleted: false }
      }
    });
    const lastMonthApplicantsCount = await prisma.application.count({
      where: {
        job: { department: { organizationId } },
        appliedAt: { lte: lastDayOfLastMonth },
        candidate: { isDeleted: false }
      }
    });
    const applicantsDelta = this.calculateDelta(currentApplicantsCount, lastMonthApplicantsCount);

    // 3. Today Attendance
    const todayAttendanceCount = await prisma.attendance.count({
      where: {
        employee: { organizationId },
        date: { gte: today },
        status: { in: ["PRESENT", "LATE"] }
      }
    });
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayAttendanceCount = await prisma.attendance.count({
      where: {
        employee: { organizationId },
        date: { gte: yesterday, lt: today },
        status: { in: ["PRESENT", "LATE"] }
      }
    });
    const attendanceDelta = this.calculateDelta(todayAttendanceCount, yesterdayAttendanceCount);

    // 4. Total Projects
    const currentProjectsCount = await prisma.project.count({
      where: { organizationId }
    });
    const lastMonthProjectsCount = await prisma.project.count({
      where: {
        organizationId,
        createdAt: { lte: lastDayOfLastMonth }
      }
    });
    const projectsDelta = this.calculateDelta(currentProjectsCount, lastMonthProjectsCount);

    // 5. Attendance Overview Chart (Last 7 Days)
    const chartData = await this.getAttendanceChartData(organizationId, today);

    // 6. Schedule Widget
    const scheduleEvents = await this.getScheduleEvents(organizationId, today);

    return {
      stats: {
        totalEmployees: { value: currentEmployeesCount, delta: `${Math.abs(employeesDelta).toFixed(0)}%`, trend: employeesDelta >= 0 ? "up" : "down" },
        totalApplicants: { value: currentApplicantsCount, delta: `${Math.abs(applicantsDelta).toFixed(0)}%`, trend: applicantsDelta >= 0 ? "up" : "down" },
        todayAttendance: { value: todayAttendanceCount, delta: `${Math.abs(attendanceDelta).toFixed(0)}%`, trend: attendanceDelta >= 0 ? "up" : "down" },
        totalProjects: { value: currentProjectsCount, delta: `${Math.abs(projectsDelta).toFixed(0)}%`, trend: projectsDelta >= 0 ? "up" : "down" }
      },
      chartData,
      scheduleEvents
    };
  }

  private calculateDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async getAttendanceChartData(organizationId: string, today: Date) {
    const days = [];
    const chartData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      days.push({ start: d, end: nextDay, label: d.toLocaleDateString("en-US", { weekday: "short" }) });
    }

    for (const day of days) {
      const attendances = await prisma.attendance.findMany({
        where: {
          employee: { organizationId },
          date: { gte: day.start, lt: day.end }
        },
        select: { status: true }
      });

      let present = 0;
      let late = 0;
      let absent = 0;

      attendances.forEach(a => {
        if (a.status === "PRESENT") present++;
        else if (a.status === "LATE") late++;
        else absent++;
      });

      const total = attendances.length;
      chartData.push({
        day: day.label,
        segment1: total ? Math.round((present / total) * 100) : 0,
        segment2: total ? Math.round((late / total) * 100) : 0,
        segment3: total ? Math.round((absent / total) * 100) : 0,
      });
    }

    return chartData;
  }

  private async getScheduleEvents(organizationId: string, today: Date) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const holidays = await prisma.holiday.findMany({
      where: {
        organizationId,
        date: { gte: today, lte: nextMonth }
      },
      orderBy: { date: "asc" },
      take: 5
    });

    const applicationsWithInterviews = await prisma.application.findMany({
      where: {
        job: { department: { organizationId } },
        status: "INTERVIEW",
      },
      include: { candidate: true, job: true },
      take: 5
    });

    const grouped = new Map<string, any[]>();
    
    holidays.forEach(h => {
      const dateStr = h.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (!grouped.has(dateStr)) grouped.set(dateStr, []);
      grouped.get(dateStr)!.push({
        time: "All Day",
        subtitle: "Holiday",
        title: h.name
      });
    });

    applicationsWithInterviews.forEach((app, i) => {
      const interviewDate = new Date(today);
      interviewDate.setDate(interviewDate.getDate() + 1 + i); 
      const dateStr = interviewDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      
      if (!grouped.has(dateStr)) grouped.set(dateStr, []);
      grouped.get(dateStr)!.push({
        time: "10:00 AM", 
        subtitle: `Interview: ${app.job?.name || "Job"}`,
        title: `${app.candidate?.firstName || ""} ${app.candidate?.lastName || ""}`.trim()
      });
    });

    const result = [];
    for (const [date, events] of grouped.entries()) {
      result.push({ date, events });
    }

    return result.slice(0, 7);
  }

  async getCandidateStats(userId: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) throw new Error("Candidate not found");

    const applicationsCount = await prisma.application.count({
      where: { candidateId: candidate.id }
    });

    const interviewsCount = await prisma.application.count({
      where: { candidateId: candidate.id, status: "INTERVIEW" }
    });

    const openJobsCount = await prisma.job.count({
      where: { status: "OPEN" }
    });

    const recentApplications = await prisma.application.findMany({
      where: { candidateId: candidate.id },
      orderBy: { appliedAt: "desc" },
      take: 5,
      include: { job: true }
    });

    return {
      stats: {
        applications: applicationsCount,
        interviews: interviewsCount,
        openJobs: openJobsCount,
      },
      recentApplications: recentApplications.map(app => ({
        id: app.id,
        role: app.job?.name || "Unknown Role",
        date: app.appliedAt,
        status: app.status
      }))
    };
  }
}
