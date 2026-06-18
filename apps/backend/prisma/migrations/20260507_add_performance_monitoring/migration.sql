-- CreateTable: CenterTarget for setting performance targets
CREATE TABLE IF NOT EXISTS "CenterTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT,
    "dailyTarget" INTEGER,
    "weeklyTarget" INTEGER,
    "monthlyTarget" INTEGER,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterTarget_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CenterTarget_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: CenterPerformanceSnapshot for historical tracking
CREATE TABLE IF NOT EXISTS "CenterPerformanceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "dailyTests" INTEGER NOT NULL DEFAULT 0,
    "weeklyTests" INTEGER NOT NULL DEFAULT 0,
    "monthlyTests" INTEGER NOT NULL DEFAULT 0,
    "dailyTarget" INTEGER,
    "weeklyTarget" INTEGER,
    "monthlyTarget" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterPerformanceSnapshot_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("centerId", "snapshotDate")
);

-- CreateIndex
CREATE INDEX "CenterTarget_centerId_idx" ON "CenterTarget"("centerId");
CREATE INDEX "CenterTarget_effectiveFrom_idx" ON "CenterTarget"("effectiveFrom");
CREATE INDEX "CenterTarget_screeningTypeId_idx" ON "CenterTarget"("screeningTypeId");

CREATE INDEX "CenterPerformanceSnapshot_centerId_idx" ON "CenterPerformanceSnapshot"("centerId");
CREATE INDEX "CenterPerformanceSnapshot_snapshotDate_idx" ON "CenterPerformanceSnapshot"("snapshotDate");
CREATE INDEX "CenterPerformanceSnapshot_category_idx" ON "CenterPerformanceSnapshot"("category");
