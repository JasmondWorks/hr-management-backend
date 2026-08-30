-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropTable (drop before altering RoleType, since Membership.role depends on it)
DROP TABLE "Membership";

-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('CANDIDATE', 'EMPLOYEE', 'ORGANIZATION_ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "public"."RoleType_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "employeeRole" "EmployeeRole" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "businessRole" "BusinessRole" NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE UNIQUE INDEX "Organization_creatorId_key" ON "Organization"("creatorId");
