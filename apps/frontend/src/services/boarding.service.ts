import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import type { TCreateAnniversaryContact, TCreateBoardingInvite, TFacilityChoice } from '@zerocancer/shared/schemas/boarding.schema'
import type {
  TCreateAnniversaryContactResponse,
  TCreateBoardingInviteResponse,
  TFacilityChoiceResponse,
  TGetAnniversaryContactsResponse,
  TGetBoardingInviteesResponse,
  TGetBoardingInvitesResponse,
  TGetBoardingJoinPreviewResponse,
  TGetFacilityOptionsResponse,
} from '@zerocancer/shared/types'

export const getBoardingPreview = (token: string) =>
  request.get(endpoints.getBoardingPreview(token)) as Promise<TGetBoardingJoinPreviewResponse>

export const getMyBoardingInvites = () =>
  request.get(endpoints.getMyBoardingInvites()) as Promise<TGetBoardingInvitesResponse>

export const createBoardingInvite = (data: TCreateBoardingInvite) =>
  request.post(endpoints.createBoardingInvite(), data) as Promise<TCreateBoardingInviteResponse>

export const getBoardingInvitees = () =>
  request.get(endpoints.getBoardingInvitees()) as Promise<TGetBoardingInviteesResponse>

export const getFacilityOptions = () =>
  request.get(endpoints.getFacilityOptions()) as Promise<TGetFacilityOptionsResponse>

export const submitFacilityChoice = (data: TFacilityChoice) =>
  request.post(endpoints.submitFacilityChoice(), data) as Promise<TFacilityChoiceResponse>

export const completeBoardingVideos = (skipped?: boolean) =>
  request.post(endpoints.completeBoardingVideos(), { skipped })

export const getAnniversaryContacts = () =>
  request.get(endpoints.getAnniversaryContacts()) as Promise<TGetAnniversaryContactsResponse>

export const createAnniversaryContact = (data: TCreateAnniversaryContact) =>
  request.post(endpoints.createAnniversaryContact(), data) as Promise<TCreateAnniversaryContactResponse>

export const deleteAnniversaryContact = (id: string) =>
  request.delete(endpoints.deleteAnniversaryContact(id))
