-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Todo";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TripProfile" (
    "tripId" TEXT NOT NULL PRIMARY KEY,
    "destination" TEXT,
    "origin" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "travelers" INTEGER,
    "budget" TEXT,
    "visaNotes" TEXT,
    "activityPrefs" TEXT,
    "foodPrefs" TEXT,
    "constraints" TEXT,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripProfile_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilePriority" (
    "tripId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("tripId", "item"),
    CONSTRAINT "ProfilePriority_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatThread" (
    "threadId" TEXT NOT NULL PRIMARY KEY,
    "messagesJson" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "ChatRun" (
    "runId" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" BIGINT NOT NULL,
    "finishedAt" BIGINT,
    "error" TEXT,
    "errorCode" TEXT,
    "usageJson" TEXT,
    "sandboxKey" TEXT,
    "detachedSince" BIGINT,
    "cancelRequested" BOOLEAN,
    "driverEpoch" INTEGER,
    "parentRunId" TEXT,
    "subagentRunId" TEXT,
    "name" TEXT
);

-- CreateIndex
CREATE INDEX "ChatRun_threadId_status_idx" ON "ChatRun"("threadId", "status");

-- CreateIndex
CREATE INDEX "ChatRun_threadId_startedAt_idx" ON "ChatRun"("threadId", "startedAt");

-- CreateIndex
CREATE INDEX "ChatRun_parentRunId_startedAt_idx" ON "ChatRun"("parentRunId", "startedAt");

-- CreateIndex
CREATE INDEX "ChatRun_status_detachedSince_idx" ON "ChatRun"("status", "detachedSince");

