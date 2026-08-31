import { PatientSavingsPage } from '@/components/PatientPage/Savings/PatientSavings.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/savings')({
  component: PatientSavingsPage,
})
