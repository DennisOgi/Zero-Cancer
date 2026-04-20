import { PatientDashboardPage } from '@/components/PatientPage/Dashboard/PatientDashboard.page'
import { createFileRoute } from '@tanstack/react-router'

function PatientDashboard() {
  return <PatientDashboardPage />
}

export const Route = createFileRoute('/patient/')({
  component: PatientDashboard,
})
