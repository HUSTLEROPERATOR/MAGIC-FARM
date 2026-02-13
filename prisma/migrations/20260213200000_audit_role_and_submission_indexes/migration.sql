-- Add actorRole column to audit_logs
ALTER TABLE "audit_logs" ADD COLUMN "actorRole" TEXT;

-- Add composite indexes on submissions for leaderboard performance + duplicate prevention
CREATE INDEX IF NOT EXISTS "submissions_userId_puzzleId_idx" ON "submissions"("userId", "puzzleId");
CREATE INDEX IF NOT EXISTS "submissions_userId_puzzleId_isCorrect_idx" ON "submissions"("userId", "puzzleId", "isCorrect");
