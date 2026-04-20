import { z } from "zod";

export const inviteStaffSchema = z.object({
  centerId: z.string().min(1),
  emails: z.array(z.string().email()).min(1),
});

export const getCentersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
});

export const getCenterByIdSchema = z.object({
  id: z.string().min(1),
});
