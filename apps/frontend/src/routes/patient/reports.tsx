import {
  PatientReportDetailPage,
  PatientReportsPage,
} from '@/components/PatientPage/Reports/PatientReports.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/reports')({
  component: PatientReportsPage,
})
