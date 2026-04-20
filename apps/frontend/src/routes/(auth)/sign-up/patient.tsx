import { PatientSignupPage } from '@/components/AuthPages/SignupPage/PatientSignup.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/patient')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PatientSignupPage />
}
