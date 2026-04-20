import { AdminForgotPasswordPage } from '@/components/AdminPage/Auth/AdminForgotPassword.page'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/forgot-password')({
  component: AdminForgotPasswordPage,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)
    if (isAuth && profile === 'ADMIN') {
      return redirect({ to: '/admin' })
    }
    return null
  },
})
