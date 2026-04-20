import { DonorSignupPage } from '@/components/AuthPages/SignupPage/DonorSignup.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/donor')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DonorSignupPage />
}
