import { filterPatientScreeningTypes } from '@/lib/patient-screening-types'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export function usePatientEligibleScreeningTypes() {
  const authQuery = useQuery(useAuthUser())
  const screeningQuery = useQuery(useAllScreeningTypes())

  const gender = authQuery.data?.data?.user?.gender

  const eligibleScreenings = useMemo(
    () =>
      filterPatientScreeningTypes(screeningQuery.data?.data || [], gender),
    [screeningQuery.data?.data, gender],
  )

  return {
    screenings: eligibleScreenings,
    gender,
    isLoading: authQuery.isLoading || screeningQuery.isLoading,
    isError: authQuery.isError || screeningQuery.isError,
    error: authQuery.error || screeningQuery.error,
  }
}
