import request from '@/lib/request'
import { z } from 'zod'

// ========================================
// SCHEMAS
// ========================================

const updateBasePriceSchema = z.object({
  agreedPrice: z.number().min(0),
  reason: z.string().optional(),
})

const updateRetailPriceSchema = z.object({
  amount: z.number().min(0),
  reason: z.string().optional(),
})

const getPriceHistorySchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  screeningTypeId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  priceType: z.enum(['BASE_PRICE', 'RETAIL_PRICE']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

// ========================================
// TYPES
// ========================================

type TDataResponse<T> = {
  ok: true
  data: T
}

type TPaginatedResponse<T> = TDataResponse<
  {
    page: number
    pageSize: number
    total: number
    totalPages: number
  } & T
>

export type TScreeningTypeWithPrice = {
  id: string
  name: string
  description?: string | null
  agreedPrice: number
  screeningTypeCategoryId: string
  category: {
    id: string
    name: string
  }
}

export type TCenterService = {
  id: string
  centerId: string
  screeningTypeId: string
  amount: number
  screeningType: {
    id: string
    name: string
    description?: string | null
    agreedPrice: number
  }
  markup: number
  markupPercentage: number
}

export type TPriceHistory = {
  id: string
  screeningTypeId?: string | null
  centerId?: string | null
  priceType: 'BASE_PRICE' | 'RETAIL_PRICE'
  oldPrice: number
  newPrice: number
  changedBy: string
  reason?: string | null
  createdAt: string
  screeningType?: {
    id: string
    name: string
    agreedPrice?: number
  } | null
  center?: {
    id: string
    centerName: string
  } | null
}

type TGetScreeningTypesWithPricesResponse = TDataResponse<
  TScreeningTypeWithPrice[]
>

type TUpdateBasePriceResponse = TDataResponse<{
  screeningType: {
    id: string
    agreedPrice: number
  }
  oldPrice: number
  newPrice: number
  centersNotified: number
}>

type TGetPriceHistoryResponse = TPaginatedResponse<{
  history: TPriceHistory[]
}>

type TGetCenterServicesResponse = TDataResponse<TCenterService[]>

type TUpdateRetailPriceResponse = TDataResponse<{
  service: {
    id: string
    amount: number
  }
  oldPrice: number
  newPrice: number
  markup: number
  markupPercentage: number
}>

// ========================================
// ADMIN SERVICES
// ========================================

export const getScreeningTypesWithPrices =
  async (): Promise<TGetScreeningTypesWithPricesResponse> => {
    const res = await request.get('/api/v1/pricing/screening-types')
    return res as TGetScreeningTypesWithPricesResponse
  }

export const updateBasePrice = async (
  screeningTypeId: string,
  data: z.infer<typeof updateBasePriceSchema>,
): Promise<TUpdateBasePriceResponse> => {
  const res = await request.patch(
    `/api/v1/pricing/screening-types/${screeningTypeId}`,
    data,
  )
  return res as TUpdateBasePriceResponse
}

export const getPriceHistory = async (
  params: z.infer<typeof getPriceHistorySchema>,
): Promise<TGetPriceHistoryResponse> => {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.pageSize)
    queryParams.append('pageSize', params.pageSize.toString())
  if (params.screeningTypeId)
    queryParams.append('screeningTypeId', params.screeningTypeId)
  if (params.centerId) queryParams.append('centerId', params.centerId)
  if (params.priceType) queryParams.append('priceType', params.priceType)
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.append('dateTo', params.dateTo)

  const res = await request.get(
    `/api/v1/pricing/history?${queryParams.toString()}`,
  )
  return res as TGetPriceHistoryResponse
}

// ========================================
// CENTER SERVICES
// ========================================

export const getCenterServices =
  async (): Promise<TGetCenterServicesResponse> => {
    const res = await request.get('/api/v1/pricing/center/services')
    return res as TGetCenterServicesResponse
  }

export const updateRetailPrice = async (
  serviceId: string,
  data: z.infer<typeof updateRetailPriceSchema>,
): Promise<TUpdateRetailPriceResponse> => {
  const res = await request.patch(
    `/api/v1/pricing/center/services/${serviceId}`,
    data,
  )
  return res as TUpdateRetailPriceResponse
}

export const getCenterPriceHistory = async (
  params: z.infer<typeof getPriceHistorySchema>,
): Promise<TGetPriceHistoryResponse> => {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.pageSize)
    queryParams.append('pageSize', params.pageSize.toString())
  if (params.screeningTypeId)
    queryParams.append('screeningTypeId', params.screeningTypeId)
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.append('dateTo', params.dateTo)

  const res = await request.get(
    `/api/v1/pricing/center/history?${queryParams.toString()}`,
  )
  return res as TGetPriceHistoryResponse
}
