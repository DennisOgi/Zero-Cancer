ALTER TABLE "PatientProfile" ADD COLUMN IF NOT EXISTS "photoUrl" text;
ALTER TABLE "PatientProfile" ADD COLUMN IF NOT EXISTS "assignedCenterId" uuid REFERENCES "ServiceCenter"(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "PatientProfile_assignedCenterId_idx" ON "PatientProfile" ("assignedCenterId");
