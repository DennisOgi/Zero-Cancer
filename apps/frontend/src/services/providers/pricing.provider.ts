import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as pricingService from '../pricing.service'
import { MutationKeys, QueryKeys } from '../keys'

// ========================================
// QUERY OPTIONS
// ========================================

export const screeningTypesWithPrices = () =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypesWithPrices],
    queryFn: () => pricingService.getScreeningTypesWithPrices(),
  })

export const priceHistory = (params: {
  page?: number
  pageSize?: number
  screeningTypeId?: string
  centerId?: string
  priceType?: 'BASE_PRICE' | 'RETAIL_PRICE'
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.priceHistory, params],
    queryFn: () => pricingService.getPriceHistory(params),
  })

export const centerServices = () =>
  queryOptions({
    queryKey: [QueryKeys.centerServices],
    queryFn: () => pricingService.getCenterServices(),
  })

export const centerPriceHistory = (params: {
  page?: number
  pageSize?: number
  screeningTypeId?: string
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.centerPriceHistory, params],
    queryFn: () => pricingService.getCenterPriceHistory(params),
  })

// ========================================
// QUERY HOOKS
// ========================================

export const useScreeningTypesWithPrices = () => {
  return useQuery(screeningTypesWithPrices())
}

export const usePriceHistory = (params: {
  page?: number
  pageSize?: number
  screeningTypeId?: string
  centerId?: string
  priceType?: 'BASE_PRICE' | 'RETAIL_PRICE'
  dateFrom?: string
  dateTo?: string
}) => {
  return useQuery(priceHistory(params))
}

export const useCenterServices = () => {
  return useQuery(centerServices())
}

export const useCenterPriceHistory = (params: {
  page?: number
  pageSize?: number
  screeningTypeId?: string
  dateFrom?: string
  dateTo?: string
}) => {
  return useQuery(centerPriceHistory(params))
}

// ========================================
// MUTATION HOOKS
// ========================================

export const useUpdateBasePrice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateBasePrice],
    mutationFn: ({
      screeningTypeId,
      agreedPrice,
      reason,
    }: {
      screeningTypeId: string
      agreedPrice: number
      reason?: string
    }) => pricingService.updateBasePrice(screeningTypeId, { agreedPrice, reason }),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.screeningTypesWithPrices],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.priceHistory],
      })
    },
  })
}

export const useUpdateRetailPrice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateRetailPrice],
    mutationFn: ({
      serviceId,
      amount,
      reason,
    }: {
      serviceId: string
      amount: number
      reason?: string
    }) => pricingService.updateRetailPrice(serviceId, { amount, reason }),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerServices],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerPriceHistory],
      })
    },
  })
}
