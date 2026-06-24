## Entities

User {
id: string;
email: string;
password: string;
firstName: string;
lastName: string
phone: string
role: RoleType;
isEmailVerified: boolean
organizationId: ForeignKey<Organization>
organization: <Organization>
}

EmployeePersonalInfo {
dateOfBirth: Date
maritalStatus: MaritalStatus
gender: Gender
nationality: string
address: string
city: string;
state: string;
zipCode: string;
}

EmployeeProfessionalInfo {
userName: string;
employeeType: EmployeeType;
probationEndDate: Date | null
probationPeriodInMonths: int
startDate: Date
workingDays: DayOfWeek[]
endDate: Date | null
}

EmployeeDocuments {
appointmentLetterUrl: string;
salarySlipsUrls?: string[];
relivingLetterUrl?: string;
experienceLetterUrl?:string
resumeUrl:string
}

Employee {
id: string
userId: string;
departmentId: ForeignKey<Department>
department: <Department>
departmentDesignationId: ForeignKey<DepartmentDesignation>
departmentDesignation: <DepartmentDesignation>
type: EmployeeType
workArrangement: WorkArrangement
officeLocation: OfficeLocation
slackId: string
githubUsername?: string // only for developers
}

Department {
id: string
name: string
organizationId: ForeignKey<Organization>
organization: <Organization>
}

DepartmentEnrollment {
employeeId: ForeignKey<Employee>
employee: <Employee>
departmentId: ForeignKey<Department>
department: <Department>
departmentDesignationId: ForeignKey<DepartmentDesignation>
departmentDesignation: <DepartmentDesignation>
startDate: Date
endDate: Date | null
}

DepartmentDesignation {
id: string
name: string
departmentId: ForeignKey<Department>
}

AttendanceRecord {
employeeId: ForeignKey<Employee>
employee: <Employee>
date: Date
checkInTime: Date | null
checkOutTime: Date | null
status: AttendanceStatus
}

Payroll {
employeeId: ForeignKey<Employee>
employee: <Employee>
month: int
year: int
amount: double
status: PayrollStatus
}

Job {
id: string
name: string
description: string
departmentId: ForeignKey<Department>
department: <Department>
departmentDesignationId: ForeignKey<DepartmentDesignation>
departmentDesignation: <DepartmentDesignation>
location: string;
amount: string;
workArrangement: WorkArrangement;
}

Leave {
employeeId: ForeignKey<Employee>
employee: <Employee>
startDate: Date
endDate: Date
status: LeaveStatus
leaveReason: string
}

Candidate {
id: string
name: string
email: string
phone: string
address: string
resumeUrl: string
}

Interviewer {
id: string
name: string
email: string
}

Application {
id: string
candidateId: ForeignKey<Candidate>
candidate: <Candidate>
jobId: ForeignKey<Job>
job: <Job>
appliedAt: Date
status: ApplicationStatus
}

Interview {
id: string
applicationId: ForeignKey<Application>
application: <Application>
interviewerId: ForeignKey<Interviewer>
interviewer: <Interviewer>
scheduledAt: Date
status: InterviewStatus
}

Organization {
id: string
name: string
slug: string
}

Announcement {
id: string
organizationId: ForeignKey<Organization>
organization: <Organization>
title: string
content: string
}

Notification {
title: string;
message: string;
userId: string | null
user: <User> | null
isRead: boolean;
}

Settings {
is2FAEnabled: boolean;
isPushNotificationsEnabled: boolean;
isEmailNotificationsEnabled: boolean;
}

## Enums

- RoleType { HR_MANAGER, DEPARTMENT_ADMIN, EMPLOYEE }
- AttendanceStatus { PRESENT, ABSENT, LATE, ON_LEAVE, WEEKEND }
- JobStatus { ACTIVE, INACTIVE }
- LeaveType { CASUAL, SICK, VACATION }
- LeaveStatus { PENDING, APPROVED, REJECTED }
- PayrollStatus { PAID, UNPAID }
- ApplicationStatus { APPLIED, INTERVIEW, OFFERED, ACCEPTED, REJECTED }
- InterviewStatus { SCHEDULED, COMPLETED, CANCELLED }
- EmployeeType { CONTRACT, FULL_TIME, PART_TIME }
- WorkArrangement { REMOTE, ON_SITE, HYBRID }
