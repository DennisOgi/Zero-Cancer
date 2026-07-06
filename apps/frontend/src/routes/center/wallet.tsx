import { featureFlags } from '@/lib/feature-flags'
import { CenterWalletPage } from '@/components/CenterPages/CenterWallet.page'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/wallet')({
  beforeLoad: () => {
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
