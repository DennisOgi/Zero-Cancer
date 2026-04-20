import { CenterDashboard } from '@/components/CenterPages/CenterDashboard.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/')({
  component: CenterDashboard,
})
