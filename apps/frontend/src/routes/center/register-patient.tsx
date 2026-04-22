import { CenterRegisterPatientPage } from '@/components/CenterPages/CenterRegisterPatient.page'
import { createFileRoute } from '@tanstack/react-router'

// Route for center patient registration - allows centers to register walk-in patients
export const Route = createFileRoute('/center/register-patient')({
  component: CenterRegisterPatientPage,
})
