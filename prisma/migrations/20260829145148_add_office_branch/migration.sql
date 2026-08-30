-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "officeBranchId" UUID;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "officeBranchId" UUID;

-- CreateTable
CREATE TABLE "OfficeBranch" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficeBranch_organizationId_name_key" ON "OfficeBranch"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "OfficeBranch" ADD CONSTRAINT "OfficeBranch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_officeBranchId_fkey" FOREIGN KEY ("officeBranchId") REFERENCES "OfficeBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_officeBranchId_fkey" FOREIGN KEY ("officeBranchId") REFERENCES "OfficeBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
