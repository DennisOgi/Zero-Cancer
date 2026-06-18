import { CenterResetPasswordPage } from '@/components/AuthPages/CenterResetPassword.page'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/(auth)/reset-password-center')({
  component: () => {
    const { token } = Route.useSearch()
    return <CenterResetPasswordPage token={token} />
  },
  validateSearch: z.object({
    token: z.string().catch(''),
  }),
})
