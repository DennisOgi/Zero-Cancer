import { z } from "zod";

export const associationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Association name is required").max(100),
  description: z.string().max(500).optional(),
  createdAt: z.string().optional(),
});

export const groupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(500).optional(),
  createdAt: z.string().optional(),
});

export const getCommunitiesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
});
