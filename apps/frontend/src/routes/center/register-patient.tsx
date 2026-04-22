import { CenterRegisterPatientPage } from '@/components/CenterPages/CenterRegisterPatient.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/register-patient')({
  component: CenterRegisterPatientPage,
})
