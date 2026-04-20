import LoginPage from '@/components/AuthPages/LoginPage/LoginPage.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/login')({
  component: LoginPage,
})
