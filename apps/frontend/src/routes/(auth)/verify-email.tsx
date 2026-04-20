import EmailVerificationChecker from '@/components/AuthPages/EmailVerificationChecker'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/(auth)/verify-email')({
  component: RouteComponent,
  validateSearch: z.object({
    token: z.string().catch(''),
  }),
})

function RouteComponent() {
  // Assume the token is passed as a query param: /verify-email?token=...
  const { token } = Route.useSearch()

  return <EmailVerificationChecker token={token} />
}
