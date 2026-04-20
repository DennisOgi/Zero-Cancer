import { z } from "zod";

export const getCenterAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  screeningType: z.string().optional(),
  status: z
    .enum(["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"])
    .optional(),
});

export const getCenterAppointmentByIdSchema = z.object({
  id: z.string().min(1),
});

export const cancelCenterAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export const rescheduleCenterAppointmentSchema = z.object({
  newDateTime: z.string().min(1),
  reason: z.string().optional(),
});

export const verifyCheckInCodeSchema = z.object({
  checkInCode: z.string().min(1, "Check-in code is required"),
});

export type TGetCenterAppointmentsSchema = typeof getCenterAppointmentsSchema;
export type TGetCenterAppointmentsParams = z.infer<
  typeof getCenterAppointmentsSchema
>;
export type TVerifyCheckInCodeSchema = typeof verifyCheckInCodeSchema;
export type TVerifyCheckInCodeParams = z.infer<typeof verifyCheckInCodeSchema>;
