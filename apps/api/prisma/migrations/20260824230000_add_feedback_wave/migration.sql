-- CreateEnum
CREATE TYPE "SessionFeedbackRole" AS ENUM ('MENTOR', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "ProductFeedbackCategory" AS ENUM ('CONFUSING', 'MISSING', 'DIFFICULT', 'GENERAL');

-- CreateTable
CREATE TABLE "session_feedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "role" "SessionFeedbackRole" NOT NULL,
    "wasUseful" BOOLEAN,
    "explanationsClear" BOOLEAN,
    "progressMade" BOOLEAN,
    "wouldBookAgain" BOOLEAN,
    "apprenticeRespectful" BOOLEAN,
    "learningGoalClear" BOOLEAN,
    "wouldMentorAgain" BOOLEAN,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ProductFeedbackCategory" NOT NULL DEFAULT 'GENERAL',
    "message" TEXT NOT NULL,
    "pageContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_feedback_sessionId_idx" ON "session_feedback"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "session_feedback_sessionId_authorUserId_key" ON "session_feedback"("sessionId", "authorUserId");

-- CreateIndex
CREATE INDEX "product_feedback_userId_createdAt_idx" ON "product_feedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedback" ADD CONSTRAINT "product_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
