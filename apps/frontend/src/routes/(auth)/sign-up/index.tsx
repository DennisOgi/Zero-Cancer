import SignUpFlow from '@/components/AuthPages/SignupPage/SignUpFlow'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/')({
  component: SignUpFlow,
})
