-- CreateEnum
CREATE TYPE "SyncEntityType" AS ENUM ('STUDENT', 'TEACHER', 'SUBJECT', 'TEACHER_SUBJECT_LINK');

-- CreateEnum
CREATE TYPE "SyncAction" AS ENUM ('UPSERT', 'DEACTIVATE');

-- CreateEnum
CREATE TYPE "SyncEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "sync_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "entityType" "SyncEntityType" NOT NULL,
    "action" "SyncAction" NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "SyncEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sync_events_eventId_key" ON "sync_events"("eventId");

-- CreateIndex
CREATE INDEX "sync_events_status_receivedAt_idx" ON "sync_events"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "sync_events_entityType_entityId_idx" ON "sync_events"("entityType", "entityId");
