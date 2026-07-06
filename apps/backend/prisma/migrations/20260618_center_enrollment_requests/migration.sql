CREATE TABLE IF NOT EXISTS "CenterEnrollmentRequest" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "centerId" uuid NOT NULL REFERENCES "ServiceCenter"(id) ON DELETE CASCADE,
  "screeningTypeId" uuid NOT NULL REFERENCES "ScreeningType"(id) ON DELETE RESTRICT,
  "status" text NOT NULL DEFAULT 'PENDING',
  "message" text,
  "requestedAt" timestamptz NOT NULL DEFAULT now(),
  "respondedAt" timestamptz
);

CREATE INDEX IF NOT EXISTS "CenterEnrollmentRequest_patientId_status_idx"
  ON "CenterEnrollmentRequest" ("patientId", "status");

CREATE INDEX IF NOT EXISTS "CenterEnrollmentRequest_centerId_status_idx"
  ON "CenterEnrollmentRequest" ("centerId", "status");
