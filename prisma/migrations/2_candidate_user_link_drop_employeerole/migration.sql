-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "employeeRole";

-- DropEnum
DROP TYPE "EmployeeRole";

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_userId_key" ON "Candidate"("userId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

