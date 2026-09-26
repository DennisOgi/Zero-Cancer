import { CenterKitsPage } from '@/components/CenterPages/CenterKits.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/kits')({
  component: CenterKitsPage,
})
