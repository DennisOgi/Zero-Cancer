import * as patientService from '@/services/patient.service'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'

export const useBookSelfPayAppointment = () => {
  return useMutation({
    mutationKey: [MutationKeys.bookAppointment],
    mutationFn: patientService.bookSelfPayAppointment,
  })
}

export const useJoinWaitlist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.joinWaitlist],
    mutationFn: patientService.joinWaitlist,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.patientWaitlists],
      })
    },
  })
}

export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.leaveWaitlist],
    mutationFn: patientService.leaveWaitlist,
    onSettled: () => {
      // Invalidate patient waitlists to refresh the list
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.patientWaitlists],
      })
      // Also invalidate waitlist status queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some(
            (key) =>
              typeof key === 'string' &&
              (key.includes('patientWaitlists') || key.includes('waitlist')),
          ),
      })
    },
  })
}

// Get patient waitlists (paginated, filterable)
export const usePatientWaitlists = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'EXPIRED'
}) =>
  queryOptions({
    queryKey: [QueryKeys.patientWaitlists, params],
    queryFn: () => patientService.getPatientWaitlists(params),
  })

// Get patient waitlists with infinite loading (paginated, filterable)
export const usePatientWaitlistsInfinite = (params: {
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'EXPIRED'
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.patientWaitlists, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return patientService.getPatientWaitlists({
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

// Get a specific waitlist entry
export const usePatientWaitlist = (waitlistId: string) =>
  queryOptions({
    queryKey: [QueryKeys.patientWaitlists, waitlistId],
    queryFn: () => patientService.getPatientWaitlist(waitlistId),
    enabled: !!waitlistId,
  })

// Check if patient is already in waitlist for a specific screening type
export const useCheckWaitlistStatus = (screeningTypeId: string) =>
  queryOptions({
    queryKey: [QueryKeys.patientWaitlists, 'status', screeningTypeId],
    queryFn: () => patientService.checkWaitlistStatus(screeningTypeId),
    enabled: !!screeningTypeId,
    staleTime: 1000 * 60 * 45, // 45 minutes
  })

// Get eligible centers for a matched allocation
export const useEligibleCenters = (
  allocationId: string,
  page = 1,
  size = 20,
  state?: string,
  lga?: string,
) =>
  queryOptions({
    queryKey: [
      QueryKeys.authUser,
      'eligibleCenters',
      allocationId,
      page,
      size,
      state,
      lga,
    ],
    queryFn: () =>
      patientService.getEligibleCenters(allocationId, page, size, state, lga),
    enabled: !!allocationId,
  })

// Get eligible centers with infinite loading
export const useEligibleCentersInfinite = (
  allocationId: string,
  size = 20,
  state?: string,
  lga?: string,
) =>
  infiniteQueryOptions({
    queryKey: [
      QueryKeys.authUser,
      'eligibleCenters',
      'infinite',
      allocationId,
      size,
      state,
      lga,
    ],
    queryFn: ({ pageParam }) =>
      patientService.getEligibleCenters(
        allocationId,
        pageParam,
        size,
        state,
        lga,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
    enabled: !!allocationId,
  })

// Select center for a matched allocation
// Used for booking an appointment when you have an allocation
export function useSelectCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.selectCenter],
    mutationFn: patientService.selectCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.authUser, 'patientAppointments'],
      })
    },
  })
}

// Get patient appointments (paginated, filterable)
export function usePatientAppointments(params: {
  page?: number
  size?: number
  status?: string
}) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, QueryKeys.patientAppointments, params],
    queryFn: () => patientService.getPatientAppointments(params),
  })
}

// Get patient appointments with infinite loading (paginated, filterable)
export function usePatientAppointmentsInfinite(params: {
  size?: number
  status?: string
}) {
  return infiniteQueryOptions({
    queryKey: [
      QueryKeys.authUser,
      QueryKeys.patientAppointments,
      'infinite',
      params,
    ],
    queryFn: ({ pageParam }) => {
      return patientService.getPatientAppointments({
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // lastPage.data has the structure: { appointments, page, pageSize, total, totalPages }
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
  })
}

// Get check-in code for an appointment
export function useCheckInCode(appointmentId: string) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'checkInCode', appointmentId],
    queryFn: () => patientService.getCheckInCode(appointmentId),
    enabled: !!appointmentId,
  })
}

// Get appointment details by ID
export function usePatientAppointmentById(appointmentId: string) {
  return queryOptions({
    queryKey: [
      QueryKeys.authUser,
      QueryKeys.patientAppointments,
      appointmentId,
    ],
    queryFn: () => patientService.getPatientAppointmentById(appointmentId),
    enabled: !!appointmentId,
  })
}

// Get appointment results by ID (works for any role)
export function useAppointmentResults(appointmentId: string) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'appointmentResults', appointmentId],
    queryFn: () => patientService.getAppointmentResults(appointmentId),
    enabled: !!appointmentId,
  })
}

// Get patient screening results (paginated)
// export function usePatientResults(params: { page?: number; size?: number }) {
//   return queryOptions({
//     queryKey: [QueryKeys.authUser, 'patientResults', params],
//     queryFn: () => patientService.getPatientResults(params),
//   })
// }

// Get a specific screening result
export function usePatientResult(id: string) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'patientResult', id],
    queryFn: () => patientService.getPatientResult(id),
    enabled: !!id,
  })
}

// Get patient receipts (paginated)
export function usePatientReceipts(params: { page?: number; size?: number }) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'patientReceipts', params],
    queryFn: () => patientService.getPatientReceipts(params),
  })
}

// Get patient receipts with infinite loading (paginated)
export function usePatientReceiptsInfinite(params: { size?: number }) {
  return infiniteQueryOptions({
    queryKey: [QueryKeys.authUser, 'patientReceipts', 'infinite', params],
    queryFn: ({ pageParam }) => {
      return patientService.getPatientReceipts({
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
}

// Get a specific receipt
export function usePatientReceipt(id: string) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'patientReceipt', id],
    queryFn: () => patientService.getPatientReceipt(id),
    enabled: !!id,
  })
}
