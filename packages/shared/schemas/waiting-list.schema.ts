import { z } from "zod";

export const createWaitingListSchema = z.object({
  name: z.string().trim().min(2, "List name is required").max(100),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  targetGender: z.enum(["MALE", "FEMALE"]).optional(),
  screeningTypeId: z.string().uuid().optional(),
});

export const listWaitingListsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
});

export type TCreateWaitingList = z.infer<typeof createWaitingListSchema>;
