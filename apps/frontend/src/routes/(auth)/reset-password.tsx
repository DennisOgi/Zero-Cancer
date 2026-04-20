import { ResetPasswordForm } from '@/components/AuthPages/ResetPasswordForm'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/(auth)/reset-password')({
  component: ResetPasswordPage,
  validateSearch: z.object({
    token: z.string().catch(''),
  }),
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()

  return <ResetPasswordForm token={token} />
}
