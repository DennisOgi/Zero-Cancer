import { createFileRoute, redirect } from '@tanstack/react-router'
import { CenterStaffPage } from '@/components/CenterPages/CenterStaff.page'
import { useAuthUser } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/center/staff')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (auth?.data?.user?.profile !== 'CENTER') {
      throw redirect({ to: '/center' })
    }
  },
  component: CenterStaffPage,
})
