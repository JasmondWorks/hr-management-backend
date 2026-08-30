/*
  Warnings:

  - You are about to drop the column `workArrangement` on the `Job` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkLocation" AS ENUM ('ON_SITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "workArrangement",
ADD COLUMN     "contractDuration" TEXT,
ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "officeBranchId" UUID,
ADD COLUMN     "organizationId" UUID NOT NULL,
ADD COLUMN     "workLocation" "WorkLocation" NOT NULL DEFAULT 'ON_SITE';

-- DropEnum
DROP TYPE "WorkArrangement";

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
