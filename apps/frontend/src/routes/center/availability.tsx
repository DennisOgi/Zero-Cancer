import { CenterAvailabilityPage } from '@/components/CenterPages/CenterAvailability.page'
import { isFacilityAdminUser } from '@/lib/center-access'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/availability')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (!isFacilityAdminUser(auth?.data?.user)) {
      throw redirect({ to: '/center' })
    }
  },
  component: CenterAvailabilityPage,
})
