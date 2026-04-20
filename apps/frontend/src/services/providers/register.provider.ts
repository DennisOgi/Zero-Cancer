import { registerService } from '@/services'
import { MutationKeys, QueryKeys } from '@/services/keys'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  centerSchema,
  donorSchema,
  patientSchema,
} from '@zerocancer/shared/schemas/register.schema'
import type {
  TDonorRegisterResponse,
  TErrorResponse,
  TPatientRegisterResponse,
  TScreeningCenterRegisterResponse,
} from '@zerocancer/shared/types'
import type { AxiosError } from 'axios'
import { z } from 'zod'

// --- Registration Mutations ---

export const usePatientRegistration = () =>
  useMutation<
    TPatientRegisterResponse,
    AxiosError<TErrorResponse>,
    z.infer<typeof patientSchema>
  >({
    mutationKey: [MutationKeys.registerPatient],
    mutationFn: (params: z.infer<typeof patientSchema>) => {
      return registerService.registerPatient(params)
    },
  })

export const useDonorRegistration = () =>
  useMutation<
    TDonorRegisterResponse,
    AxiosError<TErrorResponse>,
    z.infer<typeof donorSchema>
  >({
    mutationKey: [MutationKeys.registerDonor],
    mutationFn: (params: z.infer<typeof donorSchema>) => {
      return registerService.registerDonor(params)
    },
  })

export const useCenterRegistration = () =>
  useMutation<
    TScreeningCenterRegisterResponse,
    AxiosError<TErrorResponse>,
    z.infer<typeof centerSchema>
  >({
    mutationKey: [MutationKeys.registerCenter],
    mutationFn: (params: z.infer<typeof centerSchema>) => {
      return registerService.registerCenter(params)
    },
  })

// --- Profile Checking Query ---

export const useCheckProfiles = (email: string) => {
  return useQuery({
    queryKey: [QueryKeys.checkProfiles, email],
    queryFn: () => registerService.checkProfiles({ email }),
    retry: false,
    enabled: !!email,
  })
}
