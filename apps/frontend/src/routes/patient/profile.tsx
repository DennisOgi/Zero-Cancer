import { PatientProfilePage } from '@/components/PatientPage/Profile/PatientProfile.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/profile')({
  component: PatientProfilePage,
})
