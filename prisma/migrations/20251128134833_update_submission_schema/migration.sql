-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL DEFAULT 'public',
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "victimName" TEXT,
    "relation" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "incidentDate" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "roadUserType" TEXT NOT NULL,
    "injuryType" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "victimStory" TEXT NOT NULL,
    "photoUrls" TEXT,
    "metaobjectId" TEXT,
    "blogPostId" TEXT,
    "blogPostUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Submission_shop_idx" ON "Submission"("shop");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_state_idx" ON "Submission"("state");

-- CreateIndex
CREATE INDEX "Submission_roadUserType_idx" ON "Submission"("roadUserType");
