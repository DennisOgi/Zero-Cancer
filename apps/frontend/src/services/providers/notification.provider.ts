import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'
import * as notificationService from '../notification.service'

// NOTE TO SELF: Make notification provider to use real-time updates either by short polling or SSE

export function useNotifications() {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'notifications'],
    queryFn: notificationService.getNotifications,
    gcTime: 1000 * 60 * 5, // Garbage collection time for query cache
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.markNotificationRead],
    mutationFn: notificationService.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.authUser, 'notifications'],
      })
    },
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createNotification],
    mutationFn: notificationService.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.authUser, 'notifications'],
      })
    },
  })
}
