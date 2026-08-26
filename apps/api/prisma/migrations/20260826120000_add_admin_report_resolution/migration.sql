-- CreateEnum
CREATE TYPE "UserReportResolutionOutcome" AS ENUM ('NO_ACTION', 'WARNING', 'USER_SUSPENDED', 'USER_DEACTIVATED', 'DISMISSED');

-- AlterTable
ALTER TABLE "user_reports" ADD COLUMN "resolutionOutcome" "UserReportResolutionOutcome",
ADD COLUMN "resolutionNote" TEXT,
ADD COLUMN "resolvedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
