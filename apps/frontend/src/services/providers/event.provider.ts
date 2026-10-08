import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import type { TCommunityEvent, TCommunityEventsListResponse } from '@zerocancer/shared/types'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

export const featuredEvents = () =>
  queryOptions({
    queryKey: ['community-events', 'featured'],
    queryFn: () =>
      request.get(endpoints.featuredCommunityEvents()) as Promise<
        TCommunityEventsListResponse
      >,
  })

export const publicEvents = (params?: { page?: number; pageSize?: number }) =>
  queryOptions({
    queryKey: ['community-events', 'public', params],
    queryFn: () =>
      request.get(endpoints.listCommunityEvents(params)) as Promise<
        TCommunityEventsListResponse
      >,
  })

export const publicEventById = (id: string) =>
  queryOptions({
    queryKey: ['community-events', 'detail', id],
    queryFn: () =>
      request.get(endpoints.communityEventById(id)) as Promise<{
        ok: boolean
        data: TCommunityEvent
      }>,
    enabled: Boolean(id),
  })

export const myEvents = () =>
  queryOptions({
    queryKey: ['community-events', 'mine'],
    queryFn: () =>
      request.get(endpoints.myCommunityEvents()) as Promise<
        TCommunityEventsListResponse
      >,
  })

export const adminEvents = (params?: { page?: number; status?: string }) =>
  queryOptions({
    queryKey: ['community-events', 'admin', params],
    queryFn: () =>
      request.get(endpoints.adminCommunityEvents(params)) as Promise<
        TCommunityEventsListResponse
      >,
  })

export function useUploadEventPhoto() {
  return useMutation({
    mutationFn: (params: {
      fileBase64: string
      fileName: string
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
    }) =>
      request.post(endpoints.uploadCommunityEventPhoto(), params) as Promise<{
        ok: boolean
        data: { url: string; publicId: string }
        error?: string
      }>,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      title: string
      body: string
      coverImageUrl: string
      imageUrls: string[]
    }) => request.post(endpoints.createCommunityEvent(), params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-events'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request.delete(endpoints.deleteCommunityEvent(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-events'] })
    },
  })
}

export function useReviewEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      status: 'APPROVED' | 'REJECTED'
      featured?: boolean
      rejectionReason?: string
    }) =>
      request.patch(endpoints.reviewCommunityEvent(params.id), {
        status: params.status,
        featured: params.featured,
        rejectionReason: params.rejectionReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-events'] })
    },
  })
}
