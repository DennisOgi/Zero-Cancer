import CenterReportsPage from '@/components/CenterPages/CenterReports.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/reports')({
  component: CenterReportsPage,
})
