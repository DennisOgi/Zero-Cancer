import LoginPage from '@/components/AuthPages/LoginPage/LoginPage.page'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  role: z.enum(['patient', 'donor', 'center']).optional(),
})

export const Route = createFileRoute('/(auth)/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})
