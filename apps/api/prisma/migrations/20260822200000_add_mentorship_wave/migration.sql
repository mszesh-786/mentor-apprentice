-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MENTORSHIP_CONTINUED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MENTORSHIP_PAUSED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MENTORSHIP_RESUMED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MENTORSHIP_COMPLETED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MENTORSHIP_ENDED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MENTORSHIP_GOAL_UPSERTED';

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ENDED');

-- CreateEnum
CREATE TYPE "MentorshipGoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "relationshipId" TEXT;

-- CreateTable
CREATE TABLE "mentorship_relationships" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "apprenticeProfileId" TEXT NOT NULL,
    "primarySkillId" TEXT NOT NULL,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_goals" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MentorshipGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "mentorship_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_relationshipId_idx" ON "bookings"("relationshipId");

-- CreateIndex
CREATE INDEX "mentorship_relationships_mentorProfileId_status_idx" ON "mentorship_relationships"("mentorProfileId", "status");

-- CreateIndex
CREATE INDEX "mentorship_relationships_apprenticeProfileId_status_idx" ON "mentorship_relationships"("apprenticeProfileId", "status");

-- CreateIndex
CREATE INDEX "mentorship_relationships_mentorProfileId_apprenticeProfileId_primarySkillId_status_idx" ON "mentorship_relationships"("mentorProfileId", "apprenticeProfileId", "primarySkillId", "status");

-- CreateIndex
CREATE INDEX "mentorship_goals_relationshipId_status_idx" ON "mentorship_goals"("relationshipId", "status");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "mentorship_relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_apprenticeProfileId_fkey" FOREIGN KEY ("apprenticeProfileId") REFERENCES "apprentice_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_primarySkillId_fkey" FOREIGN KEY ("primarySkillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_endedByUserId_fkey" FOREIGN KEY ("endedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_goals" ADD CONSTRAINT "mentorship_goals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "mentorship_relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_goals" ADD CONSTRAINT "mentorship_goals_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
