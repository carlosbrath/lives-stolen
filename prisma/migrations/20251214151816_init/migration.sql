-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
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
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
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
