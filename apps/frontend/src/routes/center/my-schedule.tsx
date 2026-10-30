import { StaffSchedulePage } from '@/components/CenterPages/StaffSchedule.page'
import { isClinicalStaffUser } from '@/lib/center-access'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/my-schedule')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    const user = auth?.data?.user
    // Only doctors/nurses manage personal hours; admins use Team schedules
    if (!isClinicalStaffUser(user)) {
      throw redirect({ to: '/center' })
    }
  },
  component: StaffSchedulePage,
})
