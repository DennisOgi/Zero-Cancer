-- Force center-registered patients to change temp password on first login
ALTER TABLE "PatientProfile" ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false;
