import { z } from "zod";

export const boardingInviteTypeSchema = z.enum(["SCREEN", "CELEBRANT"]);
export const boardingOccasionSchema = z.enum(["BIRTHDAY", "WEDDING"]);
export const facilityChoiceActionSchema = z.enum([
  "JOIN_INVITER",
  "JOIN_CENTER",
  "WAIT",
]);

const inviteToken = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .min(8)
    .max(80)
    .optional()
    .transform((value) => (value ? value.toLowerCase() : value)),
);

export const createBoardingInviteSchema = z.object({
  type: boardingInviteTypeSchema,
  waitingListId: z.string().uuid().optional(),
  boundCenterId: z.string().uuid().optional(),
});

export const facilityChoiceSchema = z.object({
  action: facilityChoiceActionSchema,
  centerId: z.string().uuid().optional(),
  notifyWhenLocal: z.boolean().optional(),
});

export const completeBoardingVideosSchema = z.object({
  skipped: z.boolean().optional(),
});

function isValidCalendarDay(month: number, day: number) {
  const probe = new Date(2024, month - 1, day);
  return probe.getMonth() === month - 1 && probe.getDate() === day;
}

export const createAnniversaryContactSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(20),
    occasion: boardingOccasionSchema,
    month: z.coerce.number().int().min(1).max(12),
    day: z.coerce.number().int().min(1).max(31),
  })
  .refine((value) => isValidCalendarDay(value.month, value.day), {
    message: "That date does not exist. Check the day for that month.",
    path: ["day"],
  });

export { inviteToken as boardingInviteTokenSchema };

export type TCreateBoardingInvite = z.infer<typeof createBoardingInviteSchema>;
export type TFacilityChoice = z.infer<typeof facilityChoiceSchema>;
export type TCreateAnniversaryContact = z.infer<
  typeof createAnniversaryContactSchema
>;
