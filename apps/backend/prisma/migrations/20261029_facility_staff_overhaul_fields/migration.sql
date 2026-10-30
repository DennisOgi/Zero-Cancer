-- Facility staff overhaul: personal schedules, attribution fields, kit EOI scope.
-- Idempotent so environments that already applied facility_staff_overhaul_fields_v2 stay safe.

CREATE TABLE IF NOT EXISTS "StaffAvailabilityRule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffId" uuid NOT NULL REFERENCES "CenterStaff"("id") ON DELETE CASCADE,
  "weekday" integer NOT NULL,
  "isOpen" boolean NOT NULL DEFAULT true,
  "startTime" text NOT NULL DEFAULT '09:00',
  "endTime" text NOT NULL DEFAULT '17:00',
  "slotMinutes" integer NOT NULL DEFAULT 60,
  "maxBookingsPerSlot" integer NOT NULL DEFAULT 4,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "StaffAvailabilityRule_staffId_weekday_key" UNIQUE ("staffId", "weekday")
);

CREATE INDEX IF NOT EXISTS "StaffAvailabilityRule_staffId_idx"
  ON "StaffAvailabilityRule" ("staffId");

CREATE TABLE IF NOT EXISTS "StaffAvailabilityException" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffId" uuid NOT NULL REFERENCES "CenterStaff"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "type" text NOT NULL,
  "startTime" text,
  "endTime" text,
  "slotMinutes" integer,
  "maxBookingsPerSlot" integer,
  "reason" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "StaffAvailabilityException_staffId_date_key" UNIQUE ("staffId", "date")
);

CREATE INDEX IF NOT EXISTS "StaffAvailabilityException_staffId_date_idx"
  ON "StaffAvailabilityException" ("staffId", "date");

ALTER TABLE "PatientProfile"
  ADD COLUMN IF NOT EXISTS "assignmentSource" text,
  ADD COLUMN IF NOT EXISTS "referredByStaffId" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PatientProfile_referredByStaffId_fkey'
  ) THEN
    ALTER TABLE "PatientProfile"
      ADD CONSTRAINT "PatientProfile_referredByStaffId_fkey"
      FOREIGN KEY ("referredByStaffId") REFERENCES "CenterStaff"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PatientProfile_referredByStaffId_idx"
  ON "PatientProfile" ("referredByStaffId");
CREATE INDEX IF NOT EXISTS "PatientProfile_assignmentSource_idx"
  ON "PatientProfile" ("assignmentSource");

ALTER TABLE "RestockRequest"
  ADD COLUMN IF NOT EXISTS "scope" text NOT NULL DEFAULT 'FACILITY',
  ADD COLUMN IF NOT EXISTS "requestedByStaffId" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RestockRequest_requestedByStaffId_fkey'
  ) THEN
    ALTER TABLE "RestockRequest"
      ADD CONSTRAINT "RestockRequest_requestedByStaffId_fkey"
      FOREIGN KEY ("requestedByStaffId") REFERENCES "CenterStaff"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "RestockRequest_scope_idx"
  ON "RestockRequest" ("scope");
CREATE INDEX IF NOT EXISTS "RestockRequest_requestedByStaffId_idx"
  ON "RestockRequest" ("requestedByStaffId");

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "rescheduleReason" text,
  ADD COLUMN IF NOT EXISTS "rescheduledAt" timestamptz;
