import { z } from "zod";

export const communityEventStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const createCommunityEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Title must be at least 5 characters." })
    .max(80, { message: "Title must be 80 characters or less." }),
  body: z
    .string()
    .trim()
    .min(40, { message: "Please add a short write-up (at least 40 characters)." })
    .max(2000, { message: "Write-up must be 2000 characters or less." }),
  coverImageUrl: z.string().url({ message: "Upload a cover photo first." }),
  imageUrls: z
    .array(z.string().url())
    .max(4, { message: "You can add up to 4 extra photos." })
    .optional()
    .default([]),
});

export const reviewCommunityEventSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  featured: z.boolean().optional(),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const listCommunityEventsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(50).default(12).optional(),
  status: communityEventStatusSchema.optional(),
  publisherType: z.enum(["DONOR", "CENTER"]).optional(),
});

export type TCreateCommunityEvent = z.infer<typeof createCommunityEventSchema>;
export type TReviewCommunityEvent = z.infer<typeof reviewCommunityEventSchema>;
