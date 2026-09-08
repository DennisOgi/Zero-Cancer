-- Multi-tenant center staff + center-bound referral payouts (Flutterwave)

ALTER TABLE "CenterStaff"
  ADD COLUMN IF NOT EXISTS "fullName" text,
  ADD COLUMN IF NOT EXISTS "bankName" text,
  ADD COLUMN IF NOT EXISTS "bankCode" text,
  ADD COLUMN IF NOT EXISTS "accountNumber" text,
  ADD COLUMN IF NOT EXISTS "accountName" text,
  ADD COLUMN IF NOT EXISTS "flutterwaveRecipientId" text,
  ADD COLUMN IF NOT EXISTS "totalEarned" double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalPaidOut" double precision NOT NULL DEFAULT 0;

UPDATE "CenterStaff"
SET "role" = CASE
  WHEN lower(coalesce("role", '')) IN ('admin') THEN 'ADMIN'
  WHEN lower(coalesce("role", '')) IN ('nurse') THEN 'NURSE'
  WHEN "role" IS NULL OR trim("role") = '' THEN 'STAFF'
  ELSE upper("role")
END;

ALTER TABLE "CenterStaffInvite"
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'NURSE',
  ADD COLUMN IF NOT EXISTS "fullName" text;

ALTER TABLE "PatientProfile"
  ADD COLUMN IF NOT EXISTS "onboardedByStaffId" uuid,
  ADD COLUMN IF NOT EXISTS "onboardedByCenterId" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PatientProfile_onboardedByStaffId_fkey'
  ) THEN
    ALTER TABLE "PatientProfile"
      ADD CONSTRAINT "PatientProfile_onboardedByStaffId_fkey"
      FOREIGN KEY ("onboardedByStaffId") REFERENCES "CenterStaff"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PatientProfile_onboardedByCenterId_fkey'
  ) THEN
    ALTER TABLE "PatientProfile"
      ADD CONSTRAINT "PatientProfile_onboardedByCenterId_fkey"
      FOREIGN KEY ("onboardedByCenterId") REFERENCES "ServiceCenter"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PatientProfile_onboardedByStaffId_idx" ON "PatientProfile"("onboardedByStaffId");
CREATE INDEX IF NOT EXISTS "PatientProfile_onboardedByCenterId_idx" ON "PatientProfile"("onboardedByCenterId");

ALTER TABLE "AgentProfile"
  ADD COLUMN IF NOT EXISTS "flutterwaveRecipientId" text;

ALTER TABLE "AgentCashout"
  ADD COLUMN IF NOT EXISTS "flutterwaveTransferId" text,
  ADD COLUMN IF NOT EXISTS "flutterwaveReference" text,
  ADD COLUMN IF NOT EXISTS "payoutProvider" text NOT NULL DEFAULT 'PAYSTACK';

CREATE TABLE IF NOT EXISTS "StaffWallet" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffId" uuid NOT NULL UNIQUE,
  "balance" double precision NOT NULL DEFAULT 0,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "StaffWallet_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "CenterStaff"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "StaffWalletTransaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId" uuid NOT NULL,
  "type" text NOT NULL,
  "amount" double precision NOT NULL,
  "balanceAfter" double precision NOT NULL,
  "reference" text,
  "description" text,
  "commissionId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "StaffWalletTransaction_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "StaffWallet"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "StaffWalletTransaction_walletId_createdAt_idx"
  ON "StaffWalletTransaction"("walletId", "createdAt");

CREATE TABLE IF NOT EXISTS "StaffCommission" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "staffId" uuid NOT NULL,
  "sourceType" text NOT NULL,
  "sourceId" text NOT NULL,
  "amount" double precision NOT NULL,
  "status" text NOT NULL DEFAULT 'AVAILABLE',
  "appointmentId" uuid,
  "note" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "StaffCommission_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "CenterStaff"("id") ON DELETE CASCADE,
  CONSTRAINT "StaffCommission_sourceType_sourceId_staffId_key"
    UNIQUE ("sourceType", "sourceId", "staffId")
);

CREATE INDEX IF NOT EXISTS "StaffCommission_staffId_status_idx" ON "StaffCommission"("staffId", "status");

CREATE TABLE IF NOT EXISTS "StaffCashout" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId" uuid NOT NULL,
  "staffId" uuid NOT NULL,
  "amount" double precision NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "payoutProvider" text NOT NULL DEFAULT 'FLUTTERWAVE',
  "flutterwaveTransferId" text,
  "flutterwaveReference" text,
  "failureReason" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "StaffCashout_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "StaffWallet"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "StaffCashout_staffId_status_idx" ON "StaffCashout"("staffId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffCashout_flutterwaveReference_key"
  ON "StaffCashout"("flutterwaveReference")
  WHERE "flutterwaveReference" IS NOT NULL;
