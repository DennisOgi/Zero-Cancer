import { StaffForgotPasswordForm } from '@/components/AuthPages/StaffForgotPasswordForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/staff/forgot-password')({
  component: StaffForgotPasswordForm,
})
