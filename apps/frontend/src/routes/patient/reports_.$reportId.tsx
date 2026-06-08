import { PatientReportDetailPage } from '@/components/PatientPage/Reports/PatientReports.page'
import { createFileRoute } from '@tanstack/react-router'

function PatientReportDetail() {
  const { reportId } = Route.useParams()
  return <PatientReportDetailPage reportId={reportId} />
}

export const Route = createFileRoute('/patient/reports_/$reportId')({
  component: PatientReportDetail,
})
