-- Per-center branded letterhead / footer for screening reports
ALTER TABLE "ServiceCenter"
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "reportFooterText" TEXT,
  ADD COLUMN IF NOT EXISTS "brandColor" TEXT;
