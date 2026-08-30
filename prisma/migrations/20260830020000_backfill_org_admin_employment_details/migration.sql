-- Organization admins are staff too, but they never pass through the invitation
-- flow that sets employment details, so their Employee rows were bare. Fill in
-- sensible values rather than leaving nulls that read as "unknown" in the UI.
--
-- A previous migration created the missing Employee/EmployeeProfile rows; this
-- one is idempotent and also covers any created since.

-- 1. Any user in an organization still lacking an Employee row.
INSERT INTO "Employee" ("id", "userId", "organizationId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", u."organizationId", NOW(), NOW()
FROM "User" u
WHERE u."organizationId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Employee" e WHERE e."userId" = u."id");

-- 2. Same for the profile row.
INSERT INTO "EmployeeProfile" ("id", "userId", "organizationId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", u."organizationId", NOW(), NOW()
FROM "User" u
WHERE u."organizationId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "EmployeeProfile" p WHERE p."userId" = u."id");

-- 3. Employment details for organization admins.
--    joiningDate  -> when their organization was created (that is the day they
--                    started running it); falls back to the account's own
--                    creation date for anyone not the creator.
--    employeeType -> FULL_TIME, the only sensible reading of someone who owns
--                    and runs the organization.
--    workLocation -> ON_SITE, matching the Job model's default.
UPDATE "Employee" e
SET "joiningDate"  = COALESCE(e."joiningDate", o."createdAt", u."createdAt"),
    "employeeType" = COALESCE(e."employeeType", 'FULL_TIME'),
    "workLocation" = COALESCE(e."workLocation", 'ON_SITE'),
    "updatedAt"    = NOW()
FROM "User" u
LEFT JOIN "Organization" o ON o."creatorId" = u."id"
WHERE e."userId" = u."id"
  AND u."businessRole" = 'ORGANIZATION_ADMIN'
  AND (e."joiningDate" IS NULL
       OR e."employeeType" IS NULL
       OR e."workLocation" IS NULL);

-- 4. Put admins at the headquarters branch where their organization has one.
UPDATE "Employee" e
SET "officeBranchId" = b."id",
    "updatedAt" = NOW()
FROM "User" u, "OfficeBranch" b
WHERE e."userId" = u."id"
  AND u."businessRole" = 'ORGANIZATION_ADMIN'
  AND e."officeBranchId" IS NULL
  AND b."organizationId" = e."organizationId"
  AND b."isHeadquarters" = true;
