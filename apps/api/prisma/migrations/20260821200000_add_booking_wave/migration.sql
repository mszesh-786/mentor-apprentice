-- CreateEnum
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('UNAVAILABLE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'DECLINED', 'CANCELLED', 'NO_SHOW');

-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'BOOKING_REQUESTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'BOOKING_ACCEPTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'BOOKING_DECLINED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'BOOKING_CANCELLED';

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "type" "AvailabilityExceptionType" NOT NULL DEFAULT 'UNAVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "apprenticeProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezoneSnapshot" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "apprenticeMessage" TEXT,
    "declineReason" TEXT,
    "cancelledByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_exceptions_mentorProfileId_date_idx" ON "availability_exceptions"("mentorProfileId", "date");

-- CreateIndex
CREATE INDEX "bookings_mentorProfileId_status_startAt_idx" ON "bookings"("mentorProfileId", "status", "startAt");

-- CreateIndex
CREATE INDEX "bookings_apprenticeProfileId_status_startAt_idx" ON "bookings"("apprenticeProfileId", "status", "startAt");

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_apprenticeProfileId_fkey" FOREIGN KEY ("apprenticeProfileId") REFERENCES "apprentice_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
