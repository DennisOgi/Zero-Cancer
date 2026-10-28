-- Group multi-line Kits and Devices Expressions of Interest
ALTER TABLE "RestockRequest" ADD COLUMN IF NOT EXISTS "invoiceNumber" text;
CREATE INDEX IF NOT EXISTS "RestockRequest_invoiceNumber_idx" ON "RestockRequest" ("invoiceNumber");

-- Backfill EOI numbers previously embedded in reason text
UPDATE "RestockRequest"
SET "invoiceNumber" = substring(reason from 'Expression of Interest (EOI-[A-Z0-9]+):')
WHERE "invoiceNumber" IS NULL
  AND reason ~ 'Expression of Interest EOI-[A-Z0-9]+:';
