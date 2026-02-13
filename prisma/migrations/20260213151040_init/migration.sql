-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('SINGLE_TABLE', 'MULTI_TABLE', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PuzzleType" AS ENUM ('DIGITAL', 'PHYSICAL', 'OBSERVATION', 'LISTENING', 'HYBRID');

-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "AllianceEffect" AS ENUM ('NONE', 'HINT_SHARING', 'POINT_BONUS', 'POINT_PENALTY', 'COMMON_GOAL');

-- CreateEnum
CREATE TYPE "LibraryEntryType" AS ENUM ('ARTICLE', 'PUZZLE_EXPLAIN', 'HISTORY', 'CURIOSITY', 'TECHNIQUE', 'LOCKED');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('ACHIEVEMENT', 'EVENT_TITLE', 'SPECIAL', 'COLLABORATION', 'STREAK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "alias" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privacyAcceptedAt" TIMESTAMP(3),
    "privacyVersion" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "marketingOptInAt" TIMESTAMP(3),
    "marketingVersion" TEXT,
    "marketingOptOutAt" TIMESTAMP(3),
    "evidenceHash" TEXT,
    "ipAddressHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_nights" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "joinCode" TEXT,
    "currentRoundId" TEXT,
    "openingNarrative" TEXT,
    "closingNarrative" TEXT,
    "nextEventTeaser" TEXT,
    "theme" TEXT,
    "spectatorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_nights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "eventNightId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCodeHash" TEXT NOT NULL,
    "joinCodeSalt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_memberships" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "table_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "eventNightId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "RoundType" NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answerHash" TEXT NOT NULL,
    "answerSalt" TEXT NOT NULL,
    "scoringJson" JSONB,
    "puzzleType" "PuzzleType" NOT NULL DEFAULT 'DIGITAL',
    "physicalHint" TEXT,
    "environmentNote" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "penaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerText" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "attemptsCount" INTEGER NOT NULL DEFAULT 1,
    "timeToSolveMs" BIGINT,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "flaggedReason" TEXT,
    "isSpectator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clue_board_messages" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,

    CONSTRAINT "clue_board_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alliances" (
    "id" TEXT NOT NULL,
    "eventNightId" TEXT NOT NULL,
    "tableAId" TEXT NOT NULL,
    "tableBId" TEXT NOT NULL,
    "status" "AllianceStatus" NOT NULL DEFAULT 'PENDING',
    "handshakeCode" TEXT,
    "effectType" "AllianceEffect" NOT NULL DEFAULT 'NONE',
    "sharedHints" BOOLEAN NOT NULL DEFAULT false,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "commonGoal" TEXT,
    "commonGoalMet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "dissolvedAt" TIMESTAMP(3),

    CONSTRAINT "alliances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "metaJson" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "externalUrl" TEXT,
    "entryType" "LibraryEntryType" NOT NULL DEFAULT 'ARTICLE',
    "linkedEventId" TEXT,
    "linkedPuzzleId" TEXT,
    "requiresEventId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "events" INTEGER NOT NULL DEFAULT 0,
    "riddles" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "BadgeCategory" NOT NULL DEFAULT 'ACHIEVEMENT',
    "triggerType" TEXT,
    "triggerValue" INTEGER,
    "eventNightId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_awards" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_metrics" (
    "id" TEXT NOT NULL,
    "eventNightId" TEXT NOT NULL,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "totalSpectators" INTEGER NOT NULL DEFAULT 0,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "avgSolveTimeMs" BIGINT NOT NULL DEFAULT 0,
    "medianSolveTimeMs" BIGINT NOT NULL DEFAULT 0,
    "totalHintsUsed" INTEGER NOT NULL DEFAULT 0,
    "avgHintsPerPuzzle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAlliances" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "hardestPuzzleId" TEXT,
    "easiestPuzzleId" TEXT,
    "puzzleMetricsJson" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_alias_key" ON "users"("alias");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_alias_idx" ON "users"("alias");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "consents_userId_idx" ON "consents"("userId");

-- CreateIndex
CREATE INDEX "consents_privacyAcceptedAt_idx" ON "consents"("privacyAcceptedAt");

-- CreateIndex
CREATE INDEX "consents_marketingOptInAt_idx" ON "consents"("marketingOptInAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_nights_joinCode_key" ON "event_nights"("joinCode");

-- CreateIndex
CREATE INDEX "event_nights_status_idx" ON "event_nights"("status");

-- CreateIndex
CREATE INDEX "event_nights_startsAt_idx" ON "event_nights"("startsAt");

-- CreateIndex
CREATE INDEX "tables_eventNightId_idx" ON "tables"("eventNightId");

-- CreateIndex
CREATE INDEX "tables_joinCodeHash_idx" ON "tables"("joinCodeHash");

-- CreateIndex
CREATE INDEX "table_memberships_userId_idx" ON "table_memberships"("userId");

-- CreateIndex
CREATE INDEX "table_memberships_tableId_idx" ON "table_memberships"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "table_memberships_tableId_userId_key" ON "table_memberships"("tableId", "userId");

-- CreateIndex
CREATE INDEX "rounds_eventNightId_idx" ON "rounds"("eventNightId");

-- CreateIndex
CREATE INDEX "rounds_status_idx" ON "rounds"("status");

-- CreateIndex
CREATE INDEX "puzzles_roundId_idx" ON "puzzles"("roundId");

-- CreateIndex
CREATE INDEX "hints_puzzleId_idx" ON "hints"("puzzleId");

-- CreateIndex
CREATE INDEX "submissions_puzzleId_idx" ON "submissions"("puzzleId");

-- CreateIndex
CREATE INDEX "submissions_userId_idx" ON "submissions"("userId");

-- CreateIndex
CREATE INDEX "submissions_tableId_idx" ON "submissions"("tableId");

-- CreateIndex
CREATE INDEX "submissions_isCorrect_idx" ON "submissions"("isCorrect");

-- CreateIndex
CREATE INDEX "clue_board_messages_tableId_idx" ON "clue_board_messages"("tableId");

-- CreateIndex
CREATE INDEX "clue_board_messages_userId_idx" ON "clue_board_messages"("userId");

-- CreateIndex
CREATE INDEX "clue_board_messages_createdAt_idx" ON "clue_board_messages"("createdAt");

-- CreateIndex
CREATE INDEX "alliances_eventNightId_idx" ON "alliances"("eventNightId");

-- CreateIndex
CREATE UNIQUE INDEX "alliances_tableAId_tableBId_key" ON "alliances"("tableAId", "tableBId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "library_entries_category_idx" ON "library_entries"("category");

-- CreateIndex
CREATE INDEX "library_entries_isPublished_idx" ON "library_entries"("isPublished");

-- CreateIndex
CREATE INDEX "library_entries_entryType_idx" ON "library_entries"("entryType");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_userId_key" ON "leaderboard_entries"("userId");

-- CreateIndex
CREATE INDEX "leaderboard_entries_points_idx" ON "leaderboard_entries"("points");

-- CreateIndex
CREATE INDEX "badges_category_idx" ON "badges"("category");

-- CreateIndex
CREATE INDEX "badge_awards_userId_idx" ON "badge_awards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "badge_awards_badgeId_userId_key" ON "badge_awards"("badgeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_metrics_eventNightId_key" ON "event_metrics"("eventNightId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_memberships" ADD CONSTRAINT "table_memberships_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_memberships" ADD CONSTRAINT "table_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clue_board_messages" ADD CONSTRAINT "clue_board_messages_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clue_board_messages" ADD CONSTRAINT "clue_board_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_tableAId_fkey" FOREIGN KEY ("tableAId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_tableBId_fkey" FOREIGN KEY ("tableBId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_metrics" ADD CONSTRAINT "event_metrics_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE CASCADE ON UPDATE CASCADE;
