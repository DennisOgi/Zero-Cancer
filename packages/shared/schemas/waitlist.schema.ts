import { z } from "zod";

export const getPatientWaitlistsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["PENDING", "MATCHED", "EXPIRED"]).optional(),
});

export const getAllWaitlistsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  demandOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const joinWaitlistSchema = z.object({
  screeningTypeId: z
    .string()
    .min(1, { message: "Screening type is required." }),
});

export const leaveWaitlistSchema = z.object({
  waitlistId: z.string().min(1, { message: "Waitlist ID is required." }),
});

export const triggerMatchingSchema = z.object({
  patientsPerScreeningType: z.number().min(1).max(100).optional(),
  maxTotalPatients: z.number().min(1).max(1000).optional(),
  enableParallelProcessing: z.boolean().optional(),
  maxConcurrentScreeningTypes: z.number().min(1).max(10).optional(),
  enableDemographicTargeting: z.boolean().optional(),
  enableGeographicTargeting: z.boolean().optional(),
  allocationExpiryDays: z.number().min(1).max(365).optional(),
});

export type TGetPatientWaitlistsSchema = typeof getPatientWaitlistsSchema;
export type TGetPatientWaitlistsParams = z.infer<
  typeof getPatientWaitlistsSchema
>;
export type TGetAllWaitlistsSchema = typeof getAllWaitlistsSchema;
export type TGetAllWaitlistsParams = z.infer<typeof getAllWaitlistsSchema>;
export type TJoinWaitlistSchema = typeof joinWaitlistSchema;
export type TJoinWaitlistParams = z.infer<typeof joinWaitlistSchema>;
export type TLeaveWaitlistSchema = typeof leaveWaitlistSchema;

export type TtriggerMatchingSchema = typeof triggerMatchingSchema;
export type TtriggerMatchingParams = z.infer<typeof triggerMatchingSchema>;
