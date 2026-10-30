import { CenterProfilePage } from '@/components/CenterPages/CenterProfile.page'
import { isFacilityAdminUser } from '@/lib/center-access'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/profile')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (!isFacilityAdminUser(auth?.data?.user)) {
      throw redirect({ to: '/center' })
    }
  },
  component: CenterProfilePage,
})
