import { StaffResetPasswordForm } from '@/components/AuthPages/StaffResetPasswordForm'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/(auth)/staff/reset-password')({
  validateSearch: z.object({
    token: z.string().catch(''),
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useSearch()
  return <StaffResetPasswordForm token={token} />
}
