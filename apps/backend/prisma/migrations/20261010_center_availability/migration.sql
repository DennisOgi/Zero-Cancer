CREATE TABLE IF NOT EXISTS "CenterAvailabilityRule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" uuid NOT NULL REFERENCES "ServiceCenter"("id") ON DELETE CASCADE,
  "weekday" integer NOT NULL,
  "isOpen" boolean NOT NULL DEFAULT true,
  "startTime" text NOT NULL DEFAULT '09:00',
  "endTime" text NOT NULL DEFAULT '17:00',
  "slotMinutes" integer NOT NULL DEFAULT 60,
  "maxBookingsPerSlot" integer NOT NULL DEFAULT 4,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "CenterAvailabilityRule_centerId_weekday_key" UNIQUE ("centerId", "weekday")
);

CREATE INDEX IF NOT EXISTS "CenterAvailabilityRule_centerId_idx"
  ON "CenterAvailabilityRule" ("centerId");

CREATE TABLE IF NOT EXISTS "CenterAvailabilityException" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" uuid NOT NULL REFERENCES "ServiceCenter"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "type" text NOT NULL,
  "startTime" text,
  "endTime" text,
  "slotMinutes" integer,
  "maxBookingsPerSlot" integer,
  "reason" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "CenterAvailabilityException_centerId_date_key" UNIQUE ("centerId", "date")
);

CREATE INDEX IF NOT EXISTS "CenterAvailabilityException_centerId_date_idx"
  ON "CenterAvailabilityException" ("centerId", "date");

ALTER TABLE "NotificationRecipient" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "NotificationRecipient" ADD COLUMN IF NOT EXISTS "centerId" uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'NotificationRecipient_centerId_fkey'
  ) THEN
    ALTER TABLE "NotificationRecipient"
      ADD CONSTRAINT "NotificationRecipient_centerId_fkey"
      FOREIGN KEY ("centerId") REFERENCES "ServiceCenter"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "NotificationRecipient_centerId_idx"
  ON "NotificationRecipient" ("centerId");
