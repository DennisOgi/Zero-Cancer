import { CenterEarningsPage } from '@/components/CenterPages/CenterEarnings.page'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/earnings')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    const user = auth?.data?.user
    const isFacilityAdmin =
      user?.profile === 'CENTER' || user?.staffRole === 'ADMIN'
    if (isFacilityAdmin || !user?.staffId) {
      throw redirect({ to: '/center' })
    }
  },
  component: CenterEarningsPage,
})
