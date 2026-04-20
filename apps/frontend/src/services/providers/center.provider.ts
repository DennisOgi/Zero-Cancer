import { MutationKeys, QueryKeys } from '@/services/keys'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { getCenterAppointmentsSchema } from '@zerocancer/shared/schemas/appointment.schema'
import { getCentersQuerySchema } from '@zerocancer/shared/schemas/center.schema'
import type { z } from 'zod'
import * as centerService from '../center.service'

// --- Center Query Providers ---

export const centers = (params: z.infer<typeof getCentersQuerySchema>) =>
  queryOptions({
    queryKey: [QueryKeys.centers, params],
    queryFn: () => centerService.getCenters(params),
  })

// Get centers with infinite loading (paginated, filterable)
export const centersInfinite = (params: {
  pageSize?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  lga?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.centers, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return centerService.getCenters({
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

export const centerById = (id: string) =>
  queryOptions({
    queryKey: [QueryKeys.centerById, id],
    queryFn: () => centerService.getCenterById(id),
    enabled: !!id,
  })

// --- Staff Management Queries ---

export const staffInvites = () =>
  queryOptions({
    queryKey: [QueryKeys.centerStaffInvites],
    queryFn: () => centerService.getStaffInvites(),
  })

export const validateStaffInvite = (token: string) =>
  queryOptions({
    queryKey: [QueryKeys.validateStaffInvite, token],
    queryFn: () => centerService.validateStaffInvite(token),
    enabled: !!token && token.length > 10,
    retry: false, // Don't retry failed validation attempts
  })

// --- Staff Management Mutations ---

export const useInviteStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.inviteStaff],
    mutationFn: centerService.inviteStaff,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerStaffInvites],
      })
    },
  })
}

export const useCreateCenterStaffPassword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createCenterStaffPassword],
    mutationFn: centerService.createCenterStaffPassword,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerStaffInvites],
      })
    },
  })
}

export const useCenterStaffForgotPassword = () =>
  useMutation({
    mutationKey: [MutationKeys.centerStaffForgotPassword],
    mutationFn: centerService.centerStaffForgotPassword,
  })

export const useCenterStaffResetPassword = () =>
  useMutation({
    mutationKey: [MutationKeys.centerStaffResetPassword],
    mutationFn: centerService.centerStaffResetPassword,
  })

export const useCenterStaffLogin = () =>
  useMutation({
    mutationKey: [MutationKeys.centerStaffLogin],
    mutationFn: centerService.centerStaffLogin,
  })

export const centerAppointments = (
  params: z.infer<typeof getCenterAppointmentsSchema>,
) =>
  queryOptions({
    queryKey: [QueryKeys.centerAppointments, params],
    queryFn: () => centerService.getCenterAppointments(params),
  })

// Get center appointments with infinite loading (paginated, filterable)
export const centerAppointmentsInfinite = (params: {
  pageSize?: number
  screeningType?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.centerAppointments, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return centerService.getCenterAppointments({
        ...params,
        page: pageParam,
        pageSize: params.pageSize ?? 20, // Provide default to match schema requirement
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
  })

export const centerAppointmentById = (id: string) =>
  queryOptions({
    queryKey: [QueryKeys.centerAppointmentById, id],
    queryFn: () => centerService.getCenterAppointmentById(id),
    enabled: !!id,
  })

// Get appointment results by ID (works for any role)
export const useAppointmentResults = (appointmentId: string) =>
  queryOptions({
    queryKey: [QueryKeys.authUser, 'appointmentResults', appointmentId],
    queryFn: () => centerService.getAppointmentResults(appointmentId),
    enabled: !!appointmentId,
  })

export const useCancelCenterAppointment = () =>
  useMutation({
    mutationKey: [MutationKeys.cancelCenterAppointment],
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      centerService.cancelCenterAppointment(id, { reason }),
  })

export const useVerifyCheckInCode = () =>
  useMutation({
    mutationKey: [MutationKeys.verifyCheckInCode],
    mutationFn: centerService.verifyCheckInCode,
  })

export const useDeleteResultFile = () =>
  useMutation({
    mutationKey: [MutationKeys.deleteResultFile],
    mutationFn: ({
      fileId,
      reason,
      notifyPatient,
    }: {
      fileId: string
      reason?: string
      notifyPatient?: boolean
    }) => centerService.deleteResultFile(fileId, { reason, notifyPatient }),
  })

export const useRestoreResultFile = () =>
  useMutation({
    mutationKey: [MutationKeys.restoreResultFile],
    mutationFn: ({ fileId }: { fileId: string }) =>
      centerService.restoreResultFile(fileId),
  })

export const useCompleteAppointment = () =>
  useMutation({
    mutationKey: [MutationKeys.completeAppointment],
    mutationFn: ({
      appointmentId,
      completionNotes,
    }: {
      appointmentId: string
      completionNotes?: string
    }) => centerService.completeAppointment(appointmentId, { completionNotes }),
  })

export const useUploadResults = () =>
  useMutation({
    mutationKey: [MutationKeys.uploadResult],
    mutationFn: ({
      appointmentId,
      files,
      notes,
    }: {
      appointmentId: string
      files: Array<{
        fileName: string
        originalName: string
        filePath: string
        fileType: string
        fileSize: number
        url: string
        cloudinaryId: string
      }>
      notes?: string
    }) => centerService.uploadResults(appointmentId, { files, notes }),
  })
