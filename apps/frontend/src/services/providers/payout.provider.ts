import { MutationKeys, QueryKeys } from '@/services/keys'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import * as payoutService from '../payout.service'

// --- Query Providers ---

// Admin Queries
export const allCenterBalances = () =>
  queryOptions({
    queryKey: [QueryKeys.payouts, 'center-balances'],
    queryFn: () => payoutService.getAllCenterBalances(),
  })

export const centerBalance = (centerId: string) =>
  queryOptions({
    queryKey: [QueryKeys.payouts, 'center-balance', centerId],
    queryFn: () => payoutService.getCenterBalance(centerId),
    enabled: !!centerId,
  })

export const payouts = (filters?: {
  page?: number
  limit?: number
  centerId?: string
  status?: string
  type?: string
  batchReference?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.payouts, 'list', filters],
    queryFn: () => payoutService.getPayouts(filters),
  })

// Center Queries
export const centerPayouts = (
  centerId: string,
  filters?: {
    page?: number
    limit?: number
    status?: string
  },
) =>
  queryOptions({
    queryKey: [QueryKeys.payouts, 'center', centerId, filters],
    queryFn: () => payoutService.getCenterPayouts(centerId, filters),
    enabled: !!centerId,
  })

export const centerTransactionHistory = (
  centerId: string,
  filters?: {
    page?: number
    limit?: number
    status?: string
    startDate?: Date
    endDate?: Date
  },
) =>
  queryOptions({
    queryKey: [QueryKeys.payouts, 'center-transactions', centerId, filters],
    queryFn: () => payoutService.getCenterTransactionHistory(centerId, filters),
    enabled: !!centerId,
  })

// Utility Queries
export const banks = () =>
  queryOptions({
    queryKey: [QueryKeys.payouts, 'banks'],
    queryFn: () => payoutService.getBanks(),
  })

// --- Mutation Providers ---

// Admin Mutations
export const useCreateManualPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.createManualPayout],
    mutationFn: payoutService.createManualPayout,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.payouts] })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.payouts, 'center-balances'],
      })
      if (data.data.centerId) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.payouts, 'center-balance', data.data.centerId],
        })
      }
    },
  })
}

export const useProcessPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.processPayout],
    mutationFn: payoutService.processPayout,
    onSuccess: () => {
      // Invalidate all payout-related queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.payouts] })
    },
  })
}

export const useRetryPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.retryPayout],
    mutationFn: payoutService.retryPayout,
    onSuccess: () => {
      // Invalidate all payout-related queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.payouts] })
    },
  })
}

export const useVerifyAccount = () => {
  return useMutation({
    mutationKey: [MutationKeys.verifyAccount],
    mutationFn: ({
      accountNumber,
      bankCode,
    }: {
      accountNumber: string
      bankCode: string
    }) => payoutService.verifyAccount(accountNumber, bankCode),
  })
}

// --- Infinite Query Providers ---

export const payoutsInfinite = (filters?: {
  centerId?: string
  status?: string
  type?: string
  batchReference?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.payouts, 'infinite', filters],
    queryFn: ({ pageParam }) => {
      return payoutService.getPayouts({
        ...filters,
        page: pageParam,
        limit: 20,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data
      return pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined
    },
  })

export const centerTransactionHistoryInfinite = (
  centerId: string,
  filters?: {
    status?: string
    startDate?: Date
    endDate?: Date
  },
) =>
  infiniteQueryOptions({
    queryKey: [
      QueryKeys.payouts,
      'center-transactions-infinite',
      centerId,
      filters,
    ],
    queryFn: ({ pageParam }) => {
      return payoutService.getCenterTransactionHistory(centerId, {
        ...filters,
        page: pageParam,
        limit: 20,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data
      return pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined
    },
    enabled: !!centerId,
  })
