import request from '@/lib/request'
import {
  getScreeningTypeByIdSchema,
  getScreeningTypeByNameSchema,
  getScreeningTypesByCategoryParamSchema,
  getScreeningTypesByCategoryQuerySchema,
  getScreeningTypesQuerySchema,
  screeningTypeCategorySchema,
  screeningTypeSchema,
} from '@zerocancer/shared/schemas/screeningType.schema'
import type {
  TGetScreeningTypeCategoriesResponse,
  TGetScreeningTypeResponse,
  TGetScreeningTypesResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'
import * as endpoints from './endpoints'

const ScreeningTypeArraySchema = z.array(screeningTypeSchema)
const ScreeningTypeCategoryArraySchema = z.array(screeningTypeCategorySchema)

export const fetchScreeningTypes = async (
  params: z.infer<typeof getScreeningTypesQuerySchema>,
): Promise<TGetScreeningTypesResponse> => {
  // Validate params using shared Zod schema
  const parsed = getScreeningTypesQuerySchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for fetchScreeningTypes')
  }
  const res = await request.get<TGetScreeningTypesResponse>(
    endpoints.getScreeningTypes(parsed.data),
  )
  return {
    ...res,
    data: ScreeningTypeArraySchema.parse(res.data),
  }
}

export const fetchAllScreeningTypes = async (params?: {
  search?: string
}): Promise<TGetScreeningTypesResponse> => {
  // Validate params using shared Zod schema
  const parsed = getScreeningTypesQuerySchema.partial().safeParse(params || {})
  if (!parsed.success) {
    throw new Error('Invalid params for fetchAllScreeningTypes')
  }
  const res = await request.get<TGetScreeningTypesResponse>(
    endpoints.getAllScreeningTypes(parsed.data.search),
  )
  return {
    ...res,
    data: ScreeningTypeArraySchema.parse(res.data),
  }
}

export const fetchScreeningTypeCategories =
  async (): Promise<TGetScreeningTypeCategoriesResponse> => {
    const res = await request.get<TGetScreeningTypeCategoriesResponse>(
      endpoints.getScreeningTypeCategories(),
    )
    return {
      ...res,
      data: ScreeningTypeCategoryArraySchema.parse(res.data),
    }
  }

export const fetchScreeningTypesByCategory = async (
  categoryId: string,
  params: Omit<
    z.infer<typeof getScreeningTypesByCategoryQuerySchema>,
    'categoryId'
  >,
): Promise<TGetScreeningTypesResponse> => {
  // Validate categoryId parameter using shared Zod schema
  const parsedParam = getScreeningTypesByCategoryParamSchema.safeParse({
    categoryId,
  })
  if (!parsedParam.success) {
    throw new Error('Invalid categoryId for fetchScreeningTypesByCategory')
  }

  // Validate query params using shared Zod schema
  const parsed = getScreeningTypesQuerySchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for fetchScreeningTypesByCategory')
  }
  const res = await request.get<TGetScreeningTypesResponse>(
    endpoints.getScreeningTypesByCategory(categoryId, parsed.data),
  )
  return {
    ...res,
    data: ScreeningTypeArraySchema.parse(res.data),
  }
}

export const fetchScreeningTypeById = async (
  id: string,
): Promise<TGetScreeningTypeResponse> => {
  // Validate id parameter using shared Zod schema
  const parsed = getScreeningTypeByIdSchema.safeParse({ id })
  if (!parsed.success) {
    throw new Error('Invalid id for fetchScreeningTypeById')
  }
  const res = await request.get<TGetScreeningTypeResponse>(
    endpoints.getScreeningTypeById(id),
  )
  return {
    ...res,
    data: screeningTypeSchema.parse(res.data),
  }
}

export const fetchScreeningTypeByName = async (
  name: string,
): Promise<TGetScreeningTypeResponse> => {
  // Validate name parameter using shared Zod schema
  const parsed = getScreeningTypeByNameSchema.safeParse({ name })
  if (!parsed.success) {
    throw new Error('Invalid name for fetchScreeningTypeByName')
  }
  const res = await request.get<TGetScreeningTypeResponse>(
    endpoints.getScreeningTypeByName(name),
  )
  return {
    ...res,
    data: screeningTypeSchema.parse(res.data),
  }
}
