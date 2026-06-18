import { CenterWalletPage } from '@/components/CenterPages/CenterWallet.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/wallet')({
  component: CenterWalletPage,
})
