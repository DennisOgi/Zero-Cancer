import { MutationKeys, QueryKeys } from '@/services/keys'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { getAllWaitlistsSchema } from '@zerocancer/shared/schemas/waitlist.schema'
import type { z } from 'zod'
import * as waitlistService from '../waitlist.service'

// --- General Waitlist Query Providers ---

export const allWaitlists = (params: z.infer<typeof getAllWaitlistsSchema>) =>
  queryOptions({
    queryKey: [QueryKeys.allWaitlists, params],
    queryFn: () => waitlistService.getAllWaitlists(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
  })

// Get all waitlists with infinite loading (paginated, sortable)
export const allWaitlistsInfinite = (params: {
  pageSize?: number
  demandOrder?: 'asc' | 'desc'
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.allWaitlists, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return waitlistService.getAllWaitlists({
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
  })

// --- Patient Waitlist Query Providers ---

// export const patientWaitlists = (
//   params: z.infer<typeof getPatientWaitlistsSchema>,
// ) =>
//   queryOptions({
//     queryKey: [QueryKeys.patientWaitlists, params],
//     queryFn: () => waitlistService.getPatientWaitlists(params),
//   })

// --- Admin Waitlist Query Providers ---

/**
 * Query hook for waitlist matching statistics
 */
export const waitlistMatchingStats = () =>
  queryOptions({
    queryKey: [QueryKeys.waitlistMatchingStats],
    queryFn: waitlistService.getWaitlistMatchingStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })

/**
 * Query hook for waitlist service status
 */
export const waitlistMatchingStatus = () =>
  queryOptions({
    queryKey: [QueryKeys.waitlistMatchingStatus],
    queryFn: waitlistService.getWaitlistMatchingStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
  })

// --- Admin Waitlist Mutation Providers ---

/**
 * Mutation hook for triggering waitlist matching
 */
export const useTriggerWaitlistMatching = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.triggerWaitlistMatching],
    mutationFn: waitlistService.triggerWaitlistMatching,
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.waitlistMatchingStats],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.dashboardMetrics],
      })
      // Also invalidate any waitlist-related queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some(
            (key) => typeof key === 'string' && key.includes('waitlist'),
          ),
      })
    },
    onError: (error) => {
      console.log(error)
    },
  })
}
