import { z } from "zod";

export const weekdaySchema = z.coerce.number().int().min(0).max(6);
export const timeHmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time like 09:00");
export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const availabilityRuleSchema = z.object({
  weekday: weekdaySchema,
  isOpen: z.boolean(),
  startTime: timeHmSchema.default("09:00"),
  endTime: timeHmSchema.default("17:00"),
  slotMinutes: z.coerce.number().int().min(15).max(240).default(60),
  maxBookingsPerSlot: z.coerce.number().int().min(1).max(50).default(4),
});

export const availabilityExceptionSchema = z.object({
  date: dateKeySchema,
  type: z.enum(["CLOSED", "OPEN"]),
  startTime: timeHmSchema.optional().nullable(),
  endTime: timeHmSchema.optional().nullable(),
  slotMinutes: z.coerce.number().int().min(15).max(240).optional().nullable(),
  maxBookingsPerSlot: z.coerce.number().int().min(1).max(50).optional().nullable(),
  reason: z.string().trim().max(160).optional().nullable(),
});

export const getCenterAvailabilityQuerySchema = z.object({
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
});

export const updateCenterAvailabilitySchema = z.object({
  weekly: z.array(availabilityRuleSchema).min(1).max(7),
  exceptions: z.array(availabilityExceptionSchema).max(366).default([]),
});

export type TUpdateCenterAvailability = z.infer<
  typeof updateCenterAvailabilitySchema
>;
