-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('SKILL_SEARCH', 'MENTOR_PROFILE_VIEW');

-- CreateTable
CREATE TABLE "apprentice_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shortBio" TEXT,
    "generalLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apprentice_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blockerUserId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "actorUserId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apprentice_profiles_userId_key" ON "apprentice_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_blocks_blockedUserId_idx" ON "user_blocks"("blockedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blockerUserId_blockedUserId_key" ON "user_blocks"("blockerUserId", "blockedUserId");

-- CreateIndex
CREATE INDEX "analytics_events_type_createdAt_idx" ON "analytics_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "apprentice_profiles" ADD CONSTRAINT "apprentice_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerUserId_fkey" FOREIGN KEY ("blockerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
