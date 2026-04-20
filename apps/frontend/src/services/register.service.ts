import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  centerSchema,
  checkProfilesSchema,
  donorSchema,
  patientSchema,
} from '@zerocancer/shared/schemas/register.schema'
import type {
  TCheckProfilesResponse,
  TDonorRegisterResponse,
  TPatientRegisterResponse,
  TScreeningCenterRegisterResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'

export const registerPatient = async (
  params: z.infer<typeof patientSchema>,
): Promise<TPatientRegisterResponse> => {
  const res = await request.post(endpoints.registerUser('patient'), params)
  return res as TPatientRegisterResponse
}

export const registerDonor = async (
  params: z.infer<typeof donorSchema>,
): Promise<TDonorRegisterResponse> => {
  const res = await request.post(endpoints.registerUser('donor'), params)
  return res as TDonorRegisterResponse
}

export const registerCenter = async (
  params: z.infer<typeof centerSchema>,
): Promise<TScreeningCenterRegisterResponse> => {
  const res = await request.post(endpoints.registerUser('center'), params)
  return res as TScreeningCenterRegisterResponse
}

export const checkProfiles = async (
  params: z.infer<typeof checkProfilesSchema>,
): Promise<TCheckProfilesResponse> => {
  const res = await request.post(endpoints.checkProfiles(), params)
  return res as TCheckProfilesResponse
}
