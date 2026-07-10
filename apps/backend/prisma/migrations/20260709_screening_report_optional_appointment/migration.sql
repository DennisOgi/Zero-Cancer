-- Allow screening reports without a linked appointment
ALTER TABLE "ScreeningReport" ALTER COLUMN "appointmentId" DROP NOT NULL;
