-- AlterTable
ALTER TABLE "session_feedback" ADD COLUMN "rating" INTEGER;

ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_rating_range" CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5));
