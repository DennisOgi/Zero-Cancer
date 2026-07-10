import { createFileRoute } from '@tanstack/react-router'
import { ChangePasswordPage } from '@/components/PatientPage/ChangePassword/ChangePassword.page'

export const Route = createFileRoute('/patient/change-password')({
  component: ChangePasswordPage,
})
