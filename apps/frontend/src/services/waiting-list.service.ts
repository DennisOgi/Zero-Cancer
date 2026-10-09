import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import type { TCreateWaitingList } from '@zerocancer/shared/schemas/waiting-list.schema'
import type {
  TCreateWaitingListResponse,
  TGetWaitingListPreviewResponse,
  TGetWaitingListsResponse,
} from '@zerocancer/shared/types'

export const getWaitingListPreview = async (token: string) => {
  const res = await request.get(endpoints.getWaitingListPreview(token))
  return res as TGetWaitingListPreviewResponse
}

export const getPublicWaitingLists = async (params: {
  page?: number
  pageSize?: number
  search?: string
}) => {
  const res = await request.get(endpoints.getPublicWaitingLists(params))
  return res as TGetWaitingListsResponse
}

export const getMyWaitingLists = async () => {
  const res = await request.get(endpoints.getMyWaitingLists())
  return res as TGetWaitingListsResponse
}

export const createWaitingList = async (data: TCreateWaitingList) => {
  const res = await request.post(endpoints.createWaitingList(), data)
  return res as TCreateWaitingListResponse
}
