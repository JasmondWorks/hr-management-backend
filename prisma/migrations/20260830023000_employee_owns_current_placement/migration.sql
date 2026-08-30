-- Employee becomes the single source of truth for current placement.
-- EmployeeEnrollment recorded the same department a second time and nothing kept
-- the two in step: assigning a department updated Employee only, leaving the
-- enrollment pointing at the old one.
--
-- Every statement here is written to be safe on a database where some of it has
-- already happened, and safe on a brand new one. Prisma orders migrations by
-- folder name, and the legacy `3_employee_department` (which adds
-- Employee."departmentId") sorts AFTER every 2026-timestamped folder — so on a
-- fresh database this file runs before that column exists.

ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "designationId" UUID;

-- Carry the designation across before the enrollment table goes. Only where the
-- enrollment still agrees with the employee's current department: a designation
-- belongs to a department, so one recorded against a department the employee has
-- since left is stale and must not be promoted to "current".
--
-- Guarded because on a fresh database neither the source table nor
-- Employee."departmentId" exists yet — and there are no rows to carry either way.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = 'EmployeeEnrollment'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Employee' AND column_name = 'departmentId'
  ) THEN
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
  END IF;
END $$;

-- CASCADE removes the table's own foreign keys with it.
DROP TABLE IF EXISTS "EmployeeEnrollment" CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Employee_designationId_fkey'
  ) THEN
    ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey"
      FOREIGN KEY ("designationId") REFERENCES "DepartmentDesignation"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
