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
  logoUrl: z.union([
    z.string().url({ message: "Please provide a valid logo URL." }),
    z.literal(""),
  ]).optional(),
  reportFooterText: z
    .string()
    .max(300, { message: "Footer text must be 300 characters or less." })
    .optional(),
  brandColor: z.union([
    z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Brand color must be a hex value like #1f5b8c",
    }),
    z.literal(""),
  ]).optional(),
});

export type TUpdateCenterProfile = z.infer<typeof updateCenterProfileSchema>;
