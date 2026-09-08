-- Nurses can refer patients to any center. Earnings stay private to the nurse.

ALTER TABLE "CenterStaff"
  ADD COLUMN IF NOT EXISTS "referralCode" text;

CREATE UNIQUE INDEX IF NOT EXISTS "CenterStaff_referralCode_key"
  ON "CenterStaff"("referralCode")
  WHERE "referralCode" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "StaffReferral" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffId" uuid NOT NULL,
  "referredUserId" uuid,
  "inviteCode" text NOT NULL UNIQUE,
  "invitePhone" text,
  "inviteEmail" text,
  "inviteName" text,
  "status" text NOT NULL DEFAULT 'PENDING',
  "commissionAllowed" boolean NOT NULL DEFAULT true,
  "acceptedAt" timestamp without time zone,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "StaffReferral_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "CenterStaff"("id") ON DELETE CASCADE,
  CONSTRAINT "StaffReferral_referredUserId_fkey"
    FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "StaffReferral_staffId_status_idx"
  ON "StaffReferral"("staffId", "status");
CREATE INDEX IF NOT EXISTS "StaffReferral_referredUserId_idx"
  ON "StaffReferral"("referredUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffReferral_referredUserId_key"
  ON "StaffReferral"("referredUserId")
  WHERE "referredUserId" IS NOT NULL;

ALTER TABLE "StaffReferral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffWallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffWalletTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffCommission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffCashout" ENABLE ROW LEVEL SECURITY;
