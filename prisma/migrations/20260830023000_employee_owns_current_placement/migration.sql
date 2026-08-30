-- Employee becomes the single source of truth for current placement.
-- EmployeeEnrollment recorded the same department a second time and nothing kept
-- the two in step: assigning a department updated Employee only, leaving the
-- enrollment pointing at the old one.

ALTER TABLE "Employee" ADD COLUMN "designationId" UUID;

-- Carry the designation across before the table goes. Only where the enrollment
-- still agrees with the employee's current department: a designation belongs to
-- a department, so one recorded against a department the employee has since left
-- is stale and must not be promoted to "current".
UPDATE "Employee" e
SET "designationId" = enr."designationId"
FROM (
  SELECT DISTINCT ON ("employeeId")
         "employeeId", "designationId", "departmentId"
  FROM "EmployeeEnrollment"
  -- Open enrollments first, then most recently started.
  ORDER BY "employeeId", ("endDate" IS NULL) DESC, "startDate" DESC
) enr
WHERE enr."employeeId" = e."id"
  AND enr."departmentId" = e."departmentId";

ALTER TABLE "EmployeeEnrollment" DROP CONSTRAINT "EmployeeEnrollment_departmentId_fkey";
ALTER TABLE "EmployeeEnrollment" DROP CONSTRAINT "EmployeeEnrollment_designationId_fkey";
ALTER TABLE "EmployeeEnrollment" DROP CONSTRAINT "EmployeeEnrollment_employeeId_fkey";
DROP TABLE "EmployeeEnrollment";

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey"
  FOREIGN KEY ("designationId") REFERENCES "DepartmentDesignation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
