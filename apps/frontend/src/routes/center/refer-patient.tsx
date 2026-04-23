import { CenterReferPatientPage } from '@/components/CenterPages/CenterReferPatient.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/refer-patient')({
  component: CenterReferPatientPage,
})
