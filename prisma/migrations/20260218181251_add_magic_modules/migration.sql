-- CreateEnum
CREATE TYPE "ModuleInteractionActor" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ModuleInteractionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OpenStageStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "magic_modules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isGlobalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magic_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_modules" (
    "id" TEXT NOT NULL,
    "eventNightId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "toggledBy" TEXT,
    "toggledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_interactions" (
    "id" TEXT NOT NULL,
    "eventNightId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "actor" "ModuleInteractionActor" NOT NULL DEFAULT 'USER',
    "userId" TEXT,
    "tableId" TEXT,
    "status" "ModuleInteractionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "state" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_stage_applications" (
    "id" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT,
    "status" "OpenStageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_stage_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "magic_modules_key_key" ON "magic_modules"("key");

-- CreateIndex
CREATE INDEX "event_modules_eventNightId_idx" ON "event_modules"("eventNightId");

-- CreateIndex
CREATE INDEX "event_modules_moduleId_idx" ON "event_modules"("moduleId");

-- CreateIndex
CREATE INDEX "event_modules_eventNightId_enabled_idx" ON "event_modules"("eventNightId", "enabled");

-- CreateIndex
CREATE INDEX "event_modules_toggledAt_idx" ON "event_modules"("toggledAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_modules_eventNightId_moduleId_key" ON "event_modules"("eventNightId", "moduleId");

-- CreateIndex
CREATE INDEX "module_interactions_eventNightId_roundId_idx" ON "module_interactions"("eventNightId", "roundId");

-- CreateIndex
CREATE INDEX "module_interactions_userId_idx" ON "module_interactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "module_interactions_eventNightId_roundId_moduleKey_actor_us_key" ON "module_interactions"("eventNightId", "roundId", "moduleKey", "actor", "userId", "tableId");

-- CreateIndex
CREATE INDEX "open_stage_applications_status_idx" ON "open_stage_applications"("status");

-- CreateIndex
CREATE INDEX "open_stage_applications_email_idx" ON "open_stage_applications"("email");

-- CreateIndex
CREATE INDEX "open_stage_applications_createdAt_idx" ON "open_stage_applications"("createdAt");

-- AddForeignKey
ALTER TABLE "event_modules" ADD CONSTRAINT "event_modules_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_modules" ADD CONSTRAINT "event_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "magic_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_interactions" ADD CONSTRAINT "module_interactions_eventNightId_fkey" FOREIGN KEY ("eventNightId") REFERENCES "event_nights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_interactions" ADD CONSTRAINT "module_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
