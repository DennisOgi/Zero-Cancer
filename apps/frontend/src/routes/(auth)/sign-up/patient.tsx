import { PatientSignupPage } from '@/components/AuthPages/SignupPage/PatientSignup.page'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  ref: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-up/patient')({
  validateSearch: searchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { ref } = Route.useSearch()
  return <PatientSignupPage referralCode={ref} />
}
