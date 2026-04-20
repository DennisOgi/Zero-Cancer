import { StaffLoginForm } from '@/components/AuthPages/StaffLoginForm'
import { centers } from '@/services/providers/center.provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/staff/login')({
  component: StaffLoginForm,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(
      centers({
        page: 1,
        pageSize: 100, // Get a large number to show all available centers
        status: 'ACTIVE', // Only show active centers
      }),
    )
  },
})
