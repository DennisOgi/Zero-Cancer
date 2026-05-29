import { DonorSignupPage } from '@/components/AuthPages/SignupPage/DonorSignup.page'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const donorSignupSearchSchema = z.object({
  amount: z
    .preprocess((value) => (value == null ? undefined : String(value)), z.string().optional()),
  email: z
    .preprocess((value) => (value == null ? undefined : String(value)), z.string().email().optional())
    .catch(undefined),
  monitor: z
    .preprocess((value) => (value == null ? undefined : String(value)), z.string().optional()),
  choose: z
    .preprocess((value) => (value == null ? undefined : String(value)), z.string().optional()),
})

export const Route = createFileRoute('/(auth)/sign-up/donor')({
  validateSearch: donorSignupSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  return <DonorSignupPage />
}
