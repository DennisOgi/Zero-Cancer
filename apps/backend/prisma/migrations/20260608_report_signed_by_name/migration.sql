-- Store display name for report signatory (person who performed the test)
ALTER TABLE "ScreeningReport" ADD COLUMN IF NOT EXISTS "signedByName" TEXT;
