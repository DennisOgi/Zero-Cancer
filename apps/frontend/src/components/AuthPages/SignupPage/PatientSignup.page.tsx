import PatientForm from '@/components/AuthPages/SignupPage/PatientForm'
import { ACCESS_TOKEN_KEY } from '@/services/keys'
import { lookupReferral } from '@/services/agent-network.service'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { TPatientRegisterResponse } from '@zerocancer/shared/types'
import { toast } from 'sonner'
import { z } from 'zod'
import { patientSchema } from '@zerocancer/shared/schemas/register.schema'
import { useEffect, useMemo } from 'react'

type FormData = z.infer<typeof patientSchema>

export function PatientSignupPage({ referralCode }: { referralCode?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const storedRef =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('zerocancer_ref') || undefined
      : undefined
  const code = (referralCode || storedRef || '').trim()

  useEffect(() => {
    if (referralCode) sessionStorage.setItem('zerocancer_ref', referralCode)
  }, [referralCode])

  const { data: referralLookup } = useQuery({
    queryKey: ['referral-lookup', code],
    queryFn: () => lookupReferral(code),
    enabled: code.length > 2,
    retry: false,
  })

  const referrerLabel = useMemo(() => {
    const payload = (referralLookup as any)?.data
    return payload?.referrerName || payload?.inviteName || payload?.agentCode || code
  }, [referralLookup, code])

  const handleFormSubmit = (
    _values: FormData,
    response: TPatientRegisterResponse,
  ) => {
    sessionStorage.removeItem('zerocancer_ref')
    const token = response.data?.token
    if (token) {
      queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    }

    const recommendedCenters = response.data?.recommendedCenters || []
    const assignedCenter = response.data?.assignedCenter || null

    if (assignedCenter) {
      toast.success(
        `Account created! You've been assigned to ${assignedCenter.centerName} in ${assignedCenter.lga}, ${assignedCenter.state}.`,
      )
      navigate({ to: '/patient', replace: true })
      return
    }

    toast.success('Account created successfully')

    const state = response.data?.state || _values.state
    const lga = response.data?.localGovernment || _values.localGovernment

    sessionStorage.setItem(
      'patientSignupCenters',
      JSON.stringify({ recommendedCenters, assignedCenter }),
    )

    if (recommendedCenters.length > 0) {
      navigate({
        to: '/sign-up/patient/centers',
        search: { state, lga },
      })
      return
    }

    navigate({ to: '/patient', replace: true })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/sign-up"
          className="text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer"
        >
          Back
        </Link>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create your patient account</h1>
        <p className="text-sm text-muted-foreground">
          Register with your location so we can connect you to the nearest
          screening center for vaccination, screening, and treatment.
        </p>
        {code ? (
          <p className="text-sm text-primary">
            Referred by {referrerLabel}. We will attach this invite to your
            account.
          </p>
        ) : null}
      </div>
      <PatientForm
        onSubmitSuccess={handleFormSubmit}
        referralCode={code || undefined}
      />
    </div>
  )
}
