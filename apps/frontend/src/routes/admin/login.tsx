import { AdminLoginPage } from '@/components/AdminPage/Auth/AdminLogin.page'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)
    if (isAuth && profile === 'ADMIN') {
      return redirect({ to: '/admin' })
    }
    return null
  },
})
