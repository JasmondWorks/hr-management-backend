/*
  Warnings:

  - You are about to drop the `OrganizationSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationSettings" DROP CONSTRAINT "OrganizationSettings_organizationId_fkey";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "attendanceCheckOutTime" TEXT NOT NULL DEFAULT '17:00';

-- DropTable
DROP TABLE "OrganizationSettings";
