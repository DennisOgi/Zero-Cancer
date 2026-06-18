import { z } from "zod";

export const updateBasePriceSchema = z.object({
  agreedPrice: z.number().min(0, "Base price must be non-negative"),
  reason: z.string().optional(),
});

export const updateRetailPriceSchema = z.object({
  amount: z.number().min(0, "Retail price must be non-negative"),
  reason: z.string().optional(),
});

export const getPriceHistorySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  screeningTypeId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  priceType: z.enum(["BASE_PRICE", "RETAIL_PRICE"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
