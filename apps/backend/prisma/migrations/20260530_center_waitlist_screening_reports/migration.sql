-- Center waitlist enrollment + structured screening reports

ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "enrolledByCenterId" TEXT;
CREATE INDEX IF NOT EXISTS "Waitlist_enrolledByCenterId_idx" ON "Waitlist"("enrolledByCenterId");

ALTER TABLE "ServiceCenter" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;

CREATE TABLE IF NOT EXISTS "ScreeningReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL UNIQUE,
  "centerId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "signedByStaffId" TEXT,
  "reportCategory" TEXT NOT NULL,
  "reportTestType" TEXT NOT NULL,
  "reportSubTest" TEXT,
  "resultOutcome" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sampleType" TEXT NOT NULL,
  "resultText" TEXT NOT NULL,
  "interpretation" TEXT NOT NULL,
  "advise" TEXT NOT NULL,
  "conclusion" TEXT,
  "remarks" TEXT NOT NULL,
  "disclaimer" TEXT NOT NULL,
  "pdfUrl" TEXT,
  "pdfCloudinaryId" TEXT,
  "accessToken" TEXT UNIQUE,
  "accessTokenExpiresAt" TIMESTAMP,
  "whatsappSentAt" TIMESTAMP,
  "whatsappStatus" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ScreeningReport_centerId_createdAt_idx" ON "ScreeningReport"("centerId", "createdAt");
CREATE INDEX IF NOT EXISTS "ScreeningReport_accessToken_idx" ON "ScreeningReport"("accessToken");
CREATE INDEX IF NOT EXISTS "ScreeningReport_patientId_idx" ON "ScreeningReport"("patientId");
