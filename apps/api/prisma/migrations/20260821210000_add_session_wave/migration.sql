-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_JOINED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_COMPLETED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_NO_SHOW';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_TECH_FAILURE';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_CANCELLED';

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('READY', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionFailureReason" AS ENUM ('TECHNICAL_FAILURE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('STUB');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "cancelReason" TEXT;

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'READY',
    "videoProvider" "VideoProvider" NOT NULL DEFAULT 'STUB',
    "externalRoomId" TEXT NOT NULL,
    "joinUrl" TEXT NOT NULL,
    "mentorJoinedAt" TIMESTAMP(3),
    "apprenticeJoinedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "failureReason" "SessionFailureReason",
    "absentUserId" TEXT,
    "reportedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_summaries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "nextStep" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_bookingId_key" ON "sessions"("bookingId");

-- CreateIndex
CREATE INDEX "sessions_status_createdAt_idx" ON "sessions"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_summaries_sessionId_key" ON "session_summaries"("sessionId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_absentUserId_fkey" FOREIGN KEY ("absentUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_summaries" ADD CONSTRAINT "session_summaries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_summaries" ADD CONSTRAINT "session_summaries_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_summaries" ADD CONSTRAINT "session_summaries_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
