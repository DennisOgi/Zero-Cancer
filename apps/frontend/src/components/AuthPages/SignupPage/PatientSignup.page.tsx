import PatientForm from '@/components/AuthPages/SignupPage/PatientForm'
import { ACCESS_TOKEN_KEY } from '@/services/keys'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { TPatientRegisterResponse } from '@zerocancer/shared/types'
import { toast } from 'sonner'
import { z } from 'zod'
import { patientSchema } from '@zerocancer/shared/schemas/register.schema'

type FormData = z.infer<typeof patientSchema>

export function PatientSignupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleFormSubmit = (
    _values: FormData,
    response: TPatientRegisterResponse,
  ) => {
    const token = response.data?.token
    if (token) {
      queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    }

    const recommendedCenters = response.data?.recommendedCenters || []
    const assignedCenter = response.data?.assignedCenter || null
    const state = response.data?.state || _values.state
    const lga = response.data?.localGovernment || _values.localGovernment

    sessionStorage.setItem(
      'patientSignupCenters',
      JSON.stringify({ recommendedCenters, assignedCenter }),
    )

    toast.success('Account created successfully')

    if (assignedCenter) {
      navigate({
        to: '/sign-up/patient/centers',
        search: { state, lga },
      })
      return
    }

    if (recommendedCenters.length > 0) {
      navigate({
        to: '/sign-up/patient/centers',
        search: { state, lga },
      })
      return
    }

    navigate({ to: '/patient' })
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
      </div>
      <PatientForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
