import { z } from "zod";

export const reportCategorySchema = z.enum([
  "CERVICAL_CANCER",
  "BREAST_CANCER",
  "PROSTATE_CANCER",
  "COLORECTAL_CANCER",
]);

export const reportTestTypeSchema = z.enum([
  "HPV_TESTING",
  "VIA",
  "VILI",
  "PAP_SMEAR",
  "LIQUID_BASED_CYTOLOGY",
  "TRUSCREEN",
]);

export const reportSubTestSchema = z.enum(["DNA", "RNA", "ONCOPROTEINS"]);

export const reportResultOutcomeSchema = z.enum(["POSITIVE", "NEGATIVE"]);

export const createScreeningReportSchema = z.object({
  appointmentId: z.string().uuid(),
  reportCategory: reportCategorySchema,
  reportTestType: reportTestTypeSchema,
  reportSubTest: reportSubTestSchema.optional(),
  resultOutcome: reportResultOutcomeSchema,
  title: z.string().min(1),
  sampleType: z.string().min(1),
  resultText: z.string().min(1),
  interpretation: z.string().min(1),
  advise: z.string().min(1),
  conclusion: z.string().optional(),
  remarks: z.string().min(1),
  disclaimer: z.string().min(1),
  signedByStaffId: z.string().uuid().optional(),
  signedByName: z.string().min(2).optional(),
});

export const sendScreeningReportSchema = z.object({
  pdfUrl: z.string().url().optional(),
});

export const saveScreeningReportPdfSchema = z.object({
  pdfUrl: z.string().url(),
  pdfCloudinaryId: z.string().optional(),
});

export const centerEnrollWaitlistSchema = z.object({
  patientId: z.string().uuid(),
  screeningTypeId: z.string().uuid(),
});

export const centerRegisterPatientSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  whatsappNumber: z.string().min(7),
  password: z.string().min(6),
  dateOfBirth: z.string(),
  gender: z.enum(["MALE", "FEMALE"]),
  state: z.string().min(1),
  localGovernment: z.string().min(1),
  screeningTypeId: z.string().uuid(),
});

export type TCreateScreeningReport = z.infer<typeof createScreeningReportSchema>;
export type TCenterRegisterPatient = z.infer<typeof centerRegisterPatientSchema>;
