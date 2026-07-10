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
  serviceType: z.enum(["vaccination", "screening", "treatment"]).optional(),
});

export const getCenterByIdSchema = z.object({
  id: z.string().uuid({ message: "Invalid center id" }),
});

export const updateCenterProfileSchema = z.object({
  whatsappNumber: z
    .string()
    .min(7, { message: "Please enter a valid WhatsApp number." }),
  phone: z
    .string()
    .min(7, { message: "Please enter a valid phone number." })
    .optional(),
  address: z
    .string()
    .min(5, { message: "Please enter a valid address." })
    .optional(),
});

export type TUpdateCenterProfile = z.infer<typeof updateCenterProfileSchema>;
