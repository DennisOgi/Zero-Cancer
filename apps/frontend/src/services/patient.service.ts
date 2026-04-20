import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  bookSelfPayAppointmentSchema,
  getPatientAppointmentsSchema,
  getPatientReceiptsSchema,
  selectCenterSchema,
} from '@zerocancer/shared/schemas/register.schema'
import { getPatientResultByIdSchema } from '@zerocancer/shared/schemas/result.schema'
import {
  getPatientWaitlistsSchema,
  joinWaitlistSchema,
  leaveWaitlistSchema,
} from '@zerocancer/shared/schemas/waitlist.schema'
import type {
  TBookSelfPayAppointmentResponse,
  TCheckWaitlistStatusResponse,
  // TGetPatientResultsResponse,
  TGetAppointmentResultsResponse,
  TGetCheckInCodeResponse,
  TGetEligibleCentersResponse,
  TGetPatientAppointmentByIdResponse,
  TGetPatientAppointmentsResponse,
  TGetPatientReceiptResponse,
  TGetPatientReceiptsResponse,
  TGetPatientResultByIdResponse,
  TGetPatientWaitlistResponse,
  TGetPatientWaitlistsResponse,
  TJoinWaitlistResponse,
  TLeaveWaitlistResponse,
  TSelectCenterResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'

// Book self-pay appointment
export const bookSelfPayAppointment = async (
  data: z.infer<typeof bookSelfPayAppointmentSchema>,
): Promise<TBookSelfPayAppointmentResponse> => {
  const res = await request.post(endpoints.createSelfPayAppointment(), data)
  return res as TBookSelfPayAppointmentResponse
}

// Join donation-based waitlist
export const joinWaitlist = async (
  data: z.infer<typeof joinWaitlistSchema>,
): Promise<TJoinWaitlistResponse> => {
  const res = await request.post(endpoints.joinWaitlist(), data)
  return res as TJoinWaitlistResponse
}

// Leave donation-based waitlist
export const leaveWaitlist = async (
  data: z.infer<typeof leaveWaitlistSchema>,
): Promise<TLeaveWaitlistResponse> => {
  const res = await request.post(endpoints.leaveWaitlist(), data)
  return res as TLeaveWaitlistResponse
}

// Get patient waitlists (paginated, filterable)
export const getPatientWaitlists = async (
  params: z.infer<typeof getPatientWaitlistsSchema>,
): Promise<TGetPatientWaitlistsResponse> => {
  // Validate params using shared Zod schema
  const parsed = getPatientWaitlistsSchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for getPatientWaitlists')
  }
  const res = await request.get(endpoints.getWaitlists(parsed.data))
  return res as TGetPatientWaitlistsResponse
}

// Get a specific waitlist entry
export const getPatientWaitlist = async (
  waitlistId: string,
): Promise<TGetPatientWaitlistResponse> => {
  const res = await request.get(endpoints.getWaitlist(waitlistId))
  return res as TGetPatientWaitlistResponse
}

// Check if patient is already in waitlist for a specific screening type
export const checkWaitlistStatus = async (
  screeningTypeId: string,
): Promise<TCheckWaitlistStatusResponse> => {
  const res = await request.get(endpoints.checkWaitlistStatus(screeningTypeId))
  return res as TCheckWaitlistStatusResponse
}

// Get eligible centers for a matched allocation
export const getEligibleCenters = async (
  allocationId: string,
  page = 1,
  size = 20,
  state: string | undefined,
  lga: string | undefined,
): Promise<TGetEligibleCentersResponse> => {
  const res = await request.get(
    endpoints.getEligibleCenters(allocationId, page, size, state, lga),
  )
  return res as TGetEligibleCentersResponse
}

// Select center for a matched allocation
export const selectCenter = async (
  data: z.infer<typeof selectCenterSchema>,
): Promise<TSelectCenterResponse> => {
  const res = await request.post(endpoints.selectCenter(), data)
  return res as TSelectCenterResponse
}

// Get patient appointments (paginated, filterable)
export const getPatientAppointments = async (
  params: z.infer<typeof getPatientAppointmentsSchema>,
): Promise<TGetPatientAppointmentsResponse> => {
  const res = await request.get(endpoints.getPatientAppointments(params))
  return res as TGetPatientAppointmentsResponse
}

// Get check-in code for an appointment
export const getCheckInCode = async (
  appointmentId: string,
): Promise<TGetCheckInCodeResponse> => {
  const res = await request.get(endpoints.getCheckInCode(appointmentId))
  return res as TGetCheckInCodeResponse
}

// Get appointment details by ID
export const getPatientAppointmentById = async (
  appointmentId: string,
): Promise<TGetPatientAppointmentByIdResponse> => {
  const res = await request.get(
    endpoints.getPatientAppointmentById(appointmentId),
  )
  return res as TGetPatientAppointmentByIdResponse
}

// Get appointment results by ID (works for any role)
export const getAppointmentResults = async (
  appointmentId: string,
): Promise<TGetAppointmentResultsResponse> => {
  const res = await request.get(endpoints.getAppointmentResults(appointmentId))
  return res as TGetAppointmentResultsResponse
}

// Get a specific screening result
export const getPatientResult = async (
  id: string,
): Promise<TGetPatientResultByIdResponse> => {
  const validatedParams = getPatientResultByIdSchema.safeParse({ id })
  if (!validatedParams.success) {
    throw new Error('Invalid result ID')
  }

  const res = await request.get(endpoints.getPatientResult(id))
  return res as TGetPatientResultByIdResponse
}

// Get patient receipts (paginated)
export const getPatientReceipts = async (
  params: z.infer<typeof getPatientReceiptsSchema>,
): Promise<TGetPatientReceiptsResponse> => {
  const res = await request.get(endpoints.getPatientReceipts(params))
  return res as TGetPatientReceiptsResponse
}

// Get a specific receipt
export const getPatientReceipt = async (
  id: string,
): Promise<TGetPatientReceiptResponse> => {
  const res = await request.get(endpoints.getPatientReceipt(id))
  return res as TGetPatientReceiptResponse
}
