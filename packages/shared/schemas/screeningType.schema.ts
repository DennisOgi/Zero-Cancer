import { z } from "zod";

export const screeningTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  screeningTypeCategoryId: z.string(),
  active: z.boolean(),
});

export const screeningTypeCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const getScreeningTypesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).optional(),
  search: z.string().optional(),
});

export const getScreeningTypesByCategoryQuerySchema =
  getScreeningTypesQuerySchema.extend({
    categoryId: z.string(),
  });

export const getScreeningTypeByIdSchema = z.object({
  id: z.string().min(1),
});

export const getScreeningTypeByNameSchema = z.object({
  name: z.string().min(1),
});

export const getScreeningTypesByCategoryParamSchema = z.object({
  categoryId: z.string().min(1),
});
