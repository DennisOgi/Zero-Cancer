-- Agent referral + save-to-screen network

ALTER TABLE "PatientProfile"
  ADD COLUMN IF NOT EXISTS "referralCodeUsed" TEXT,
  ADD COLUMN IF NOT EXISTS "commissionConsent" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "DonationCampaign"
  ADD COLUMN IF NOT EXISTS "invitedByAgentId" TEXT;

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "isHomeVisit" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "homeAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "referralId" TEXT,
  ADD COLUMN IF NOT EXISTS "attributedAgentId" TEXT;

CREATE TABLE IF NOT EXISTS "AgentProfile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "referralCode" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "bankName" TEXT,
  "bankCode" TEXT,
  "accountNumber" TEXT,
  "accountName" TEXT,
  "paystackRecipientCode" TEXT,
  "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalPaidOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgentProfile_status_idx" ON "AgentProfile"("status");
CREATE INDEX IF NOT EXISTS "AgentProfile_referralCode_idx" ON "AgentProfile"("referralCode");

CREATE TABLE IF NOT EXISTS "Referral" (
  "id" TEXT PRIMARY KEY,
  "referrerAgentId" TEXT NOT NULL,
  "referredUserId" TEXT,
  "inviteCode" TEXT NOT NULL UNIQUE,
  "invitePhone" TEXT,
  "inviteEmail" TEXT,
  "inviteName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "commissionAllowed" BOOLEAN NOT NULL DEFAULT true,
  "preferredCenterId" TEXT,
  "acceptedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Referral_referrerAgentId_fkey" FOREIGN KEY ("referrerAgentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Referral_referrerAgentId_status_idx" ON "Referral"("referrerAgentId", "status");
CREATE INDEX IF NOT EXISTS "Referral_referredUserId_idx" ON "Referral"("referredUserId");
CREATE INDEX IF NOT EXISTS "Referral_inviteCode_idx" ON "Referral"("inviteCode");

CREATE TABLE IF NOT EXISTS "Commission" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "appointmentId" TEXT,
  "campaignId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "Commission_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL,
  CONSTRAINT "Commission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign"("id") ON DELETE SET NULL,
  CONSTRAINT "Commission_source_unique" UNIQUE ("sourceType", "sourceId", "agentId")
);

CREATE INDEX IF NOT EXISTS "Commission_agentId_status_idx" ON "Commission"("agentId", "status");
CREATE INDEX IF NOT EXISTS "Commission_status_idx" ON "Commission"("status");

CREATE TABLE IF NOT EXISTS "AgentWallet" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL UNIQUE,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AgentWallet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgentWalletTransaction" (
  "id" TEXT PRIMARY KEY,
  "walletId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "balanceAfter" DOUBLE PRECISION NOT NULL,
  "reference" TEXT,
  "description" TEXT,
  "commissionId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AgentWalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "AgentWallet"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgentWalletTransaction_walletId_createdAt_idx" ON "AgentWalletTransaction"("walletId", "createdAt");

CREATE TABLE IF NOT EXISTS "AgentCashout" (
  "id" TEXT PRIMARY KEY,
  "walletId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paystackTransferCode" TEXT,
  "paystackReference" TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AgentCashout_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "AgentWallet"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgentCashout_agentId_status_idx" ON "AgentCashout"("agentId", "status");
CREATE INDEX IF NOT EXISTS "AgentCashout_status_idx" ON "AgentCashout"("status");

CREATE TABLE IF NOT EXISTS "SavingsPlan" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "screeningTypeId" TEXT NOT NULL,
  "preferredCenterId" TEXT,
  "targetAmount" DOUBLE PRECISION NOT NULL,
  "savedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "appointmentId" TEXT UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SavingsPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SavingsPlan_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "SavingsPlan_patientId_status_idx" ON "SavingsPlan"("patientId", "status");
CREATE INDEX IF NOT EXISTS "SavingsPlan_status_idx" ON "SavingsPlan"("status");

CREATE TABLE IF NOT EXISTS "SavingsDeposit" (
  "id" TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paymentReference" TEXT UNIQUE,
  "paymentChannel" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SavingsDeposit_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SavingsPlan"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SavingsDeposit_planId_status_idx" ON "SavingsDeposit"("planId", "status");

-- FKs that depend on AgentProfile / Referral existing
DO $$ BEGIN
  ALTER TABLE "DonationCampaign"
    ADD CONSTRAINT "DonationCampaign_invitedByAgentId_fkey"
    FOREIGN KEY ("invitedByAgentId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_referralId_fkey"
    FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_attributedAgentId_fkey"
    FOREIGN KEY ("attributedAgentId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Appointment_attributedAgentId_idx" ON "Appointment"("attributedAgentId");
CREATE INDEX IF NOT EXISTS "Appointment_referralId_idx" ON "Appointment"("referralId");
CREATE INDEX IF NOT EXISTS "Appointment_isHomeVisit_idx" ON "Appointment"("isHomeVisit");
CREATE INDEX IF NOT EXISTS "DonationCampaign_invitedByAgentId_idx" ON "DonationCampaign"("invitedByAgentId");
