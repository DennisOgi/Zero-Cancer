import { createFileRoute, redirect } from '@tanstack/react-router'
import { CenterReceiptHistoryPage } from '@/components/CenterPages/CenterReceiptHistory.page'
import { isFacilityAdminUser } from '@/lib/center-access'
import { useAuthUser } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/center/receipt-history')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (!isFacilityAdminUser(auth?.data?.user)) {
      throw redirect({ to: '/center' })
    }
  },
  component: CenterReceiptHistoryPage,
})
