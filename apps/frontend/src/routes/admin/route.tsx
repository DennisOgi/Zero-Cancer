import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { AdminLayout } from '@/components/layouts/AdminLayout'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
  beforeLoad: async ({
    context,
    location,
  }): Promise<void | ReturnType<typeof redirect>> => {
    // Don't protect admin auth routes
    const adminAuthRoutes = [
      '/admin/login',
      '/admin/forgot-password',
      '/admin/reset-password',
    ]
    if (adminAuthRoutes.includes(location.pathname)) {
      return
    }

    const { isAuth, isAuthorized, profile } = await isAuthMiddleware(
      context.queryClient,
      'admin',
    )

    if (!isAuth) return redirect({ to: '/admin/login' })

    // If authenticated but wrong role, redirect to correct dashboard
    if (!isAuthorized) {
      if (profile === 'PATIENT') return redirect({ to: '/patient' })
      if (profile === 'DONOR') return redirect({ to: '/donor' })
      if (profile === 'CENTER' || profile === 'CENTER_STAFF')
        return redirect({ to: '/center' })

      // If unknown profile, redirect to login
      return redirect({ to: '/admin/login' })
    }

    return
  },
})
