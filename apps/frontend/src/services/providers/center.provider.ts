import { persistAccessToken } from '@/lib/access-token'
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
import * as kitService from '../kit.service'
import * as staffEarningsService from '../staff-earnings.service'

// --- Center Query Providers ---

export const centers = (params: z.infer<typeof getCentersQuerySchema>) =>
  queryOptions({
    queryKey: [QueryKeys.centers, params],
    queryFn: () => centerService.getCenters(params),
    retry: false,
  })

// Get centers with infinite loading (paginated, filterable)
export const centersInfinite = (params: {
  pageSize?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  lga?: string
  serviceType?: 'vaccination' | 'screening' | 'treatment'
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

export const publicCenterAvailability = (
  id: string,
  params?: { from?: string; to?: string; staffId?: string },
) =>
  queryOptions({
    queryKey: [QueryKeys.centerAvailability, id, params],
    queryFn: () => centerService.getPublicCenterAvailability(id, params),
    enabled: !!id,
  })

export const staffAvailability = (params?: {
  from?: string
  to?: string
  staffId?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.centerAvailability, 'staff', params],
    queryFn: () => centerService.getStaffAvailability(params),
  })

export const teamStaffSchedules = () =>
  queryOptions({
    queryKey: [QueryKeys.centerAvailability, 'team'],
    queryFn: () => centerService.getTeamStaffSchedules(),
  })

export const useUpdateStaffAvailability = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updateCenterAvailability, 'staff'],
    mutationFn: centerService.updateStaffAvailability,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerAvailability],
      })
    },
  })
}

export const ownCenterAvailability = (params?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [QueryKeys.centerAvailability, 'own', params],
    queryFn: () => centerService.getCenterAvailability(params),
  })

export const useUpdateCenterAvailability = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updateCenterAvailability],
    mutationFn: centerService.updateCenterAvailability,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerAvailability],
      })
    },
  })
}

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

export const useCenterStaffLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.centerStaffLogin],
    mutationFn: centerService.centerStaffLogin,
    onSettled: (data) => {
      if (data?.data?.token) {
        persistAccessToken(queryClient, data.data.token)
        queryClient.invalidateQueries({ queryKey: ['authUser'] })
      }
    },
  })
}

export const centerAppointments = (
  params: z.infer<typeof getCenterAppointmentsSchema>,
) =>
  queryOptions({
    queryKey: [QueryKeys.centerAppointments, params],
    queryFn: () => centerService.getCenterAppointments(params),
  })

export const centerPatientsOverview = () =>
  queryOptions({
    queryKey: [QueryKeys.centerPatientsOverview],
    queryFn: () => centerService.getCenterPatientsOverview(),
  })

export const centerPatientsList = (params: {
  page?: number
  pageSize?: number
  search?: string
  assignmentSource?: string
  funding?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.centerPatientsList, params],
    queryFn: () => centerService.getCenterPatients(params),
  })

export const centerEnrollmentRequests = (status = 'PENDING') =>
  queryOptions({
    queryKey: [QueryKeys.centerEnrollmentRequests, status],
    queryFn: () => centerService.getCenterEnrollmentRequests(status),
  })

export const centerProfile = () =>
  queryOptions({
    queryKey: [QueryKeys.centerProfile],
    queryFn: () => centerService.getCenterProfile(),
  })

export const useUpdateCenterProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updateCenterProfile],
    mutationFn: centerService.updateCenterProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.centerProfile] })
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    },
  })
}

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
      kitSerialNumber,
    }: {
      appointmentId: string
      completionNotes?: string
      kitSerialNumber: string
    }) =>
      centerService.completeAppointment(appointmentId, {
        completionNotes,
        kitSerialNumber,
      }),
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

export const staffEarnings = () =>
  queryOptions({
    queryKey: [QueryKeys.staffEarnings],
    queryFn: () => staffEarningsService.getStaffEarnings(),
  })

export const useUpdateStaffBank = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updateStaffBank],
    mutationFn: staffEarningsService.updateStaffBank,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.staffEarnings] })
    },
  })
}

export const useUpdateStaffProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updateStaffProfile],
    mutationFn: staffEarningsService.updateStaffProfile,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.staffEarnings] })
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    },
  })
}

export const useCreateStaffReferralInvite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createStaffReferralInvite],
    mutationFn: staffEarningsService.createStaffReferralInvite,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.staffEarnings] })
    },
  })
}

export const useStaffCashout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.staffCashout],
    mutationFn: staffEarningsService.staffCashout,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.staffEarnings] })
    },
  })
}

export const kitStats = () =>
  queryOptions({
    queryKey: [QueryKeys.kitStats],
    queryFn: () => kitService.getKitStats(),
  })

export const kitsList = (params?: {
  page?: number
  pageSize?: number
  status?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.kits, params],
    queryFn: () => kitService.getKits(params),
  })

export const kitOrders = () =>
  queryOptions({
    queryKey: [QueryKeys.kitOrders],
    queryFn: () => kitService.getKitOrders(),
  })

export const centerMyServices = () =>
  queryOptions({
    queryKey: [QueryKeys.centerServices],
    queryFn: () => centerService.getCenterMyServices(),
  })

export const useCreateKitOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.createKitOrder],
    mutationFn: kitService.createKitOrder,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.kitOrders] })
    },
  })
}

export const useCancelKitOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.cancelKitOrder],
    mutationFn: kitService.cancelKitOrder,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.kitOrders] })
    },
  })
}

export const useKitOrderInvoice = () =>
  useMutation({
    mutationKey: [MutationKeys.getKitOrderInvoice],
    mutationFn: kitService.getKitOrderInvoice,
  })

export const adminKitOrders = (params?: { status?: string }) =>
  queryOptions({
    queryKey: [QueryKeys.adminKitOrders, params],
    queryFn: () => kitService.getAdminKitOrders(params),
  })

export const useUpdateAdminKitOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updateAdminKitOrder],
    mutationFn: kitService.updateAdminKitOrder,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.adminKitOrders] })
    },
  })
}

// --- Facility team management ---

export const staffMembers = () =>
  queryOptions({
    queryKey: [QueryKeys.centerStaffMembers],
    queryFn: () => centerService.getStaffMembers(),
  })

export const staffMemberActivity = (staffId: string) =>
  queryOptions({
    queryKey: [QueryKeys.centerStaffMemberActivity, staffId],
    queryFn: () => centerService.getStaffMemberActivity(staffId),
    enabled: Boolean(staffId),
  })

const useTeamMutation = <TArgs,>(
  key: MutationKeys,
  fn: (args: TArgs) => Promise<unknown>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [key],
    mutationFn: fn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.centerStaffMembers] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.centerStaffInvites] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.centerById] })
    },
  })
}

export const useUpdateStaffMember = () =>
  useTeamMutation(MutationKeys.updateStaffMember, centerService.updateStaffMember)

export const useRemoveStaffMember = () =>
  useTeamMutation(MutationKeys.removeStaffMember, centerService.removeStaffMember)

export const useCancelStaffInvite = () =>
  useTeamMutation(MutationKeys.cancelStaffInvite, centerService.cancelStaffInvite)

export const useResendStaffInvite = () =>
  useTeamMutation(MutationKeys.resendStaffInvite, centerService.resendStaffInvite)
