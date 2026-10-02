-- CreateEnum
CREATE TYPE "UserReportReason" AS ENUM ('HARASSMENT', 'INAPPROPRIATE_BEHAVIOR', 'SAFETY_CONCERN', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "UserReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "user_reports" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "bookingId" TEXT,
    "sessionId" TEXT,
    "mentorshipId" TEXT,
    "reason" "UserReportReason" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "UserReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_reports_reporterUserId_createdAt_idx" ON "user_reports"("reporterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "user_reports_status_idx" ON "user_reports"("status");

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorship_relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
