import ForgotPasswordForm from '@/components/AuthPages/ForgotPasswordForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPasswordForm,
})
