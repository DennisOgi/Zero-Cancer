import { MutationKeys, QueryKeys } from '@/services/keys'
import * as waitingListService from '@/services/waiting-list.service'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

export const waitingListPreview = (token?: string) =>
  queryOptions({
    queryKey: [QueryKeys.waitingListPreview, token],
    queryFn: () => waitingListService.getWaitingListPreview(token!),
    enabled: Boolean(token && token.length >= 8),
    retry: false,
    staleTime: 60 * 1000,
  })

export const publicWaitingLists = (params: {
  page?: number
  pageSize?: number
  search?: string
} = {}) =>
  queryOptions({
    queryKey: [QueryKeys.publicWaitingLists, params],
    queryFn: () => waitingListService.getPublicWaitingLists(params),
    staleTime: 30 * 1000,
  })

export const myWaitingLists = () =>
  queryOptions({
    queryKey: [QueryKeys.myWaitingLists],
    queryFn: () => waitingListService.getMyWaitingLists(),
    staleTime: 15 * 1000,
  })

export const useCreateWaitingList = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createWaitingList],
    mutationFn: waitingListService.createWaitingList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.myWaitingLists] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.publicWaitingLists] })
    },
  })
}
