import { CenterForgotPasswordPage } from '@/components/AuthPages/CenterForgotPassword.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/forgot-password-center')({
  component: CenterForgotPasswordPage,
})
