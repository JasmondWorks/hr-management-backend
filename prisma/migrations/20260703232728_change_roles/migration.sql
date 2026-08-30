/*
  Warnings:

  - The values [ORGANIZATION_ADMIN] on the enum `RoleType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "BusinessRole" ADD VALUE 'ORGANIZATION_ADMIN';

-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('CANDIDATE', 'EMPLOYEE', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "public"."RoleType_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "businessRole" DROP NOT NULL,
ALTER COLUMN "businessRole" DROP DEFAULT;
