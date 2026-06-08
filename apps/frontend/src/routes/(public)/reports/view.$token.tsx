import { PublicReportViewPage } from '@/components/PublicPages/PublicReportView.page'
import { createFileRoute } from '@tanstack/react-router'

function PublicReportView() {
  const { token } = Route.useParams()
  return <PublicReportViewPage token={token} />
}

export const Route = createFileRoute('/(public)/reports/view/$token')({
  component: PublicReportView,
})
