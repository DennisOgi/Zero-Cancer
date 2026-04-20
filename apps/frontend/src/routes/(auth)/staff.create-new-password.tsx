import { CreateStaffPassword } from '@/components/AuthPages/StaffCreateNewPasswordForm'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/(auth)/staff/create-new-password')({
  component: RouteComponent,
  validateSearch: z.object({
    token: z.string().min(1, 'Token is required').catch(''),
  }),
})

function RouteComponent() {
  const token = Route.useSearch().token

  return <CreateStaffPassword token={token} />
}
