import { CenterPatientsPage } from '@/components/CenterPages/CenterPatients.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/patients')({
  component: CenterPatientsPage,
})
