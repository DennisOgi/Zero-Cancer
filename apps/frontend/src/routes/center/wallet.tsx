import { featureFlags } from '@/lib/feature-flags'
import { isFacilityAdminUser } from '@/lib/center-access'
import { CenterWalletPage } from '@/components/CenterPages/CenterWallet.page'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/wallet')({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (!isFacilityAdminUser(auth?.data?.user)) {
      throw redirect({ to: '/center' })
    }
    if (!featureFlags.showCenterWallet) {
      throw redirect({ to: '/center/receipt-history' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  if (!featureFlags.showCenterWallet) {
    return null
  }
  return <CenterWalletPage />
}
