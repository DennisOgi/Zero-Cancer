import { AdminResetPasswordPage } from '@/components/AdminPage/Auth/AdminResetPassword.page'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export type SearchParams = { token?: string }

export const Route = createFileRoute('/admin/reset-password')({
  component: () => {
    const { token } = Route.useSearch()
    return <AdminResetPasswordPage token={token} />
  },
  validateSearch: (search): SearchParams => ({ token: search.token as string }),
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)
    if (isAuth && profile === 'ADMIN') {
      return redirect({ to: '/admin' })
    }
    return null
  },
})
