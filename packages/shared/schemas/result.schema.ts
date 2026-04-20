import { z } from "zod";

// Upload results schema
export const uploadResultsSchema = z.object({
  files: z.array(
    z.object({
      fileName: z.string(),
      originalName: z.string(),
      filePath: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
      url: z.string().url(),
      cloudinaryId: z.string(),
    })
  ),
  notes: z.string().optional(),
  folderName: z.string().optional(),
});

// Get patient results schema
export const getPatientResultsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
});

// Get patient result by ID schema
export const getPatientResultByIdSchema = z.object({
  id: z.string().uuid(),
});

// Get appointment results schema
export const getAppointmentResultsSchema = z.object({
  id: z.string().uuid(),
});

// Download result file schema
export const downloadResultFileSchema = z.object({
  fileId: z.string().uuid(),
});

// Soft delete file schema
export const deleteResultFileSchema = z.object({
  fileId: z.string().uuid(),
  reason: z.string().min(1).max(500).optional(),
  notifyPatient: z.boolean().default(true), // Allow override for pre-completion
});

// Restore deleted file schema
export const restoreResultFileSchema = z.object({
  fileId: z.string().uuid(),
});

// Complete appointment schema
export const completeAppointmentSchema = z.object({
  appointmentId: z.string(),
  completionNotes: z.string().optional(),
  kitSerialNumber: z.string().optional(), // Added for kit tracking
});

// For admin use (post-MVP)
export const getDeletedFilesSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  appointmentId: z.string().uuid().optional(),
  deletedAfter: z.coerce.date().optional(), // For 90-day cleanup
});

// Export types
export type TUploadResults = z.infer<typeof uploadResultsSchema>;
export type TGetPatientResults = z.infer<typeof getPatientResultsSchema>;
export type TGetPatientResultById = z.infer<typeof getPatientResultByIdSchema>;
export type TGetAppointmentResults = z.infer<
  typeof getAppointmentResultsSchema
>;
export type TDownloadResultFile = z.infer<typeof downloadResultFileSchema>;
export type TDeleteResultFile = z.infer<typeof deleteResultFileSchema>;
export type TRestoreResultFile = z.infer<typeof restoreResultFileSchema>;
export type TCompleteAppointment = z.infer<typeof completeAppointmentSchema>;
export type TGetDeletedFiles = z.infer<typeof getDeletedFilesSchema>;
