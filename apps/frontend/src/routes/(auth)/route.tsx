import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthLayout } from '@/components/layouts/AuthLayout'

export const Route = createFileRoute('/(auth)')({
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth } = await isAuthMiddleware(context.queryClient)

    if (isAuth) return redirect({ to: `/` })

    return null
  },
})
