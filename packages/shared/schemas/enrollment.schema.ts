import { z } from "zod";

export const respondEnrollmentRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export type TRespondEnrollmentRequest = z.infer<
  typeof respondEnrollmentRequestSchema
>;
