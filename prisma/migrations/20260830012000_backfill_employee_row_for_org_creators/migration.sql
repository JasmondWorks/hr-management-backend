-- Organization creators were never given an Employee row, so they were missing
-- from the employee list and headcount and could not be assigned a department.
-- New organizations now create one; this covers the accounts that predate that.
INSERT INTO "Employee" ("id", "userId", "organizationId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", u."organizationId", NOW(), NOW()
FROM "User" u
WHERE u."organizationId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Employee" e WHERE e."userId" = u."id");

-- Same for the profile row, which invited staff receive on acceptance.
INSERT INTO "EmployeeProfile" ("id", "userId", "organizationId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", u."organizationId", NOW(), NOW()
FROM "User" u
WHERE u."organizationId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "EmployeeProfile" p WHERE p."userId" = u."id");
