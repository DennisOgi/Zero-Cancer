import { createFileRoute, redirect } from '@tanstack/react-router'
import { CenterStaffPage } from '@/components/CenterPages/CenterStaff.page'
import { isFacilityAdminUser } from '@/lib/center-access'
import { useAuthUser } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/center/staff')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (!isFacilityAdminUser(auth?.data?.user)) {
      throw redirect({ to: '/center' })
    }
  },
  component: CenterStaffPage,
})
