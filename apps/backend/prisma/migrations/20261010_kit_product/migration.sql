ALTER TABLE "RestockRequest" ADD COLUMN IF NOT EXISTS "kitProduct" text;
ALTER TABLE "Kit" ADD COLUMN IF NOT EXISTS "kitProduct" text;
CREATE INDEX IF NOT EXISTS "RestockRequest_kitProduct_idx" ON "RestockRequest" ("kitProduct");
CREATE INDEX IF NOT EXISTS "Kit_kitProduct_idx" ON "Kit" ("kitProduct");
