import { MutationKeys, QueryKeys } from '@/services/keys'
import * as boardingService from '@/services/boarding.service'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

export const boardingPreview = (token?: string) =>
  queryOptions({
    queryKey: [QueryKeys.boardingPreview, token],
    queryFn: () => boardingService.getBoardingPreview(token!),
    enabled: Boolean(token && token.length >= 8),
    retry: false,
    staleTime: 60 * 1000,
  })

export const myBoardingInvites = () =>
  queryOptions({
    queryKey: [QueryKeys.boardingInvites],
    queryFn: boardingService.getMyBoardingInvites,
    staleTime: 15 * 1000,
  })

export const boardingInvitees = () =>
  queryOptions({
    queryKey: [QueryKeys.boardingInvitees],
    queryFn: boardingService.getBoardingInvitees,
    staleTime: 15 * 1000,
  })

export const facilityOptions = () =>
  queryOptions({
    queryKey: [QueryKeys.facilityOptions],
    queryFn: boardingService.getFacilityOptions,
    staleTime: 15 * 1000,
  })

export const anniversaryContacts = () =>
  queryOptions({
    queryKey: [QueryKeys.anniversaryContacts],
    queryFn: boardingService.getAnniversaryContacts,
    staleTime: 15 * 1000,
  })

export const useCreateBoardingInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createBoardingInvite],
    mutationFn: boardingService.createBoardingInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.boardingInvites] })
    },
  })
}

export const useFacilityChoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.facilityChoice],
    mutationFn: boardingService.submitFacilityChoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.authUser] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.facilityOptions] })
    },
  })
}

export const useCreateAnniversaryContact = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createAnniversaryContact],
    mutationFn: boardingService.createAnniversaryContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.anniversaryContacts] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.boardingInvites] })
    },
  })
}
